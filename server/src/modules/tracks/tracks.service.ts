import { trackCreateSchema, type TrackCreateInput } from "@music-city/shared";

import { createId } from "../../services/id.service.js";
import { muxService } from "../../services/mux.service.js";
import { storageService } from "../../services/storage.service.js";
import { usersService } from "../users/users.service.js";
import { tracksRepository } from "./tracks.repository.js";

const formatRuntime = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) {
    return "Ready";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const hydrateTrackUrls = <T extends { coverStorageKey?: string; coverImageUrl?: string }>(
  track: T,
) => ({
  ...track,
  coverImageUrl: track.coverStorageKey
    ? storageService.getDownloadUrl(track.coverStorageKey)
    : track.coverImageUrl,
});

export const tracksService = {
  async listTracks() {
    const tracks = await tracksRepository.list();
    return tracks.map(hydrateTrackUrls);
  },

  async listMyTracks(walletAddress: string) {
    const profile = await usersService.getProfile(walletAddress);

    if (!profile) {
      return [];
    }

    const tracks = await tracksRepository.listByArtist(profile.id);
    return tracks.map(hydrateTrackUrls);
  },

  async getTrack(trackId: string) {
    const track = await tracksRepository.findById(trackId);
    return track ? hydrateTrackUrls(track) : null;
  },

  async userOwnsTrack(walletAddress: string, trackId: string) {
    const profile = await usersService.getProfile(walletAddress);
    const track = await tracksRepository.findById(trackId);

    return Boolean(profile && track && track.artistId === profile.id);
  },

  async createTrack(walletAddress: string, input: TrackCreateInput) {
    const profile = await usersService.getProfile(walletAddress);

    if (!profile) {
      throw new Error("Create a profile before creating tracks");
    }

    const timestamp = new Date().toISOString();
    const parsed = trackCreateSchema.parse(input);
    const track = tracksRepository.upsert({
      id: createId("trk"),
      title: parsed.title,
      artistId: profile.id,
      artistName: parsed.artistName?.trim() || profile.displayName,
      releaseArtistName: parsed.artistName?.trim() || profile.displayName,
      featuredArtists: parsed.featuredArtists ?? [],
      composer: parsed.composer?.trim() || undefined,
      producer: parsed.producer?.trim() || undefined,
      isrc: parsed.isrc?.trim() || undefined,
      recordLabel: parsed.recordLabel?.trim() || undefined,
      publisher: parsed.publisher?.trim() || undefined,
      country: parsed.country?.trim() || undefined,
      genre: parsed.genre,
      runtime: "Not processed",
      priceLabel: parsed.priceLabel ?? "Private",
      status: "awaiting_upload",
      access: parsed.access,
      plays: 0,
      likes: 0,
      description: parsed.description,
      mediaProvider: "local",
      playbackReady: false,
      archiveStatus: "not_requested",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return track;
  },

  async syncMuxTrack(trackId: string) {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    if (existing.mediaProvider !== "mux") {
      return existing;
    }

    if (existing.muxAssetId) {
      const asset = await muxService.getAsset(existing.muxAssetId);

      if (asset.status === "ready") {
        return this.markPlaybackReady(trackId, {
          runtime: formatRuntime(asset.duration),
          muxAssetId: asset.id,
          muxPlaybackId: asset.playback_ids?.[0]?.id,
        });
      }

      if (asset.status === "errored") {
        return this.markFailed(trackId, "Mux asset processing failed");
      }

      return this.markMuxAssetCreated(trackId, {
        muxAssetId: asset.id,
        muxUploadId: existing.muxUploadId,
      });
    }

    if (!existing.muxUploadId) {
      return existing;
    }

    const upload = await muxService.getUpload(existing.muxUploadId);

    if (upload.status === "asset_created" && upload.asset_id) {
      const updated = await this.markMuxAssetCreated(trackId, {
        muxAssetId: upload.asset_id,
        muxUploadId: upload.id,
      });

      if (!updated.muxAssetId) {
        return updated;
      }

      const asset = await muxService.getAsset(updated.muxAssetId);

      if (asset.status === "ready") {
        return this.markPlaybackReady(trackId, {
          runtime: formatRuntime(asset.duration),
          muxAssetId: asset.id,
          muxPlaybackId: asset.playback_ids?.[0]?.id,
        });
      }

      if (asset.status === "errored") {
        return this.markFailed(trackId, "Mux asset processing failed");
      }

      return updated;
    }

    if (upload.status === "errored") {
      return this.markFailed(
        trackId,
        upload.error?.message ?? upload.error?.type ?? "Mux upload failed",
      );
    }

    if (upload.status === "cancelled") {
      return this.markFailed(trackId, "Mux upload cancelled");
    }

    if (upload.status === "timed_out") {
      return this.markFailed(trackId, "Mux upload timed out");
    }

    return existing;
  },

  async attachMaster(trackId: string, payload: {
    masterStorageKey: string;
    sourceFileName: string;
    sourceContentType: string;
    sourceSizeBytes: number;
  }) {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    return tracksRepository.upsert({
      ...existing,
      status: "uploaded",
      runtime: "Uploaded",
      mediaProvider: "local",
      masterStorageKey: payload.masterStorageKey,
      streamManifestKey: `virtual/${trackId}/master.m3u8`,
      sourceFileName: payload.sourceFileName,
      sourceContentType: payload.sourceContentType,
      sourceSizeBytes: payload.sourceSizeBytes,
      playbackReady: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async attachCoverArt(trackId: string, payload: { coverStorageKey: string }) {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    return tracksRepository.upsert({
      ...existing,
      coverStorageKey: payload.coverStorageKey,
      coverImageUrl: storageService.getDownloadUrl(payload.coverStorageKey),
      updatedAt: new Date().toISOString(),
    });
  },

  async attachMuxUpload(trackId: string, payload: {
    muxUploadId: string;
    sourceFileName: string;
    sourceContentType: string;
    sourceSizeBytes: number;
  }) {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    return tracksRepository.upsert({
      ...existing,
      status: "processing",
      runtime: "Uploading to Mux",
      mediaProvider: "mux",
      muxUploadId: payload.muxUploadId,
      muxAssetStatus: "waiting",
      sourceFileName: payload.sourceFileName,
      sourceContentType: payload.sourceContentType,
      sourceSizeBytes: payload.sourceSizeBytes,
      playbackReady: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async markProcessing(trackId: string) {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    return tracksRepository.upsert({
      ...existing,
      status: "processing",
      muxAssetStatus: existing.muxAssetStatus ?? "asset_created",
      updatedAt: new Date().toISOString(),
    });
  },

  async markPlaybackReady(trackId: string, payload: {
    runtime: string;
    streamManifestUrl?: string;
    streamMediaUrl?: string;
    muxAssetId?: string;
    muxPlaybackId?: string;
  }) {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    return tracksRepository.upsert({
      ...existing,
      status: "published",
      runtime: payload.runtime,
      playbackReady: true,
      playbackUrl:
        payload.streamMediaUrl ?? existing.playbackUrl ?? existing.streamMediaUrl,
      streamManifestUrl: payload.streamManifestUrl ?? existing.streamManifestUrl,
      streamMediaUrl: payload.streamMediaUrl ?? existing.streamMediaUrl,
      muxAssetId: payload.muxAssetId ?? existing.muxAssetId,
      muxPlaybackId: payload.muxPlaybackId ?? existing.muxPlaybackId,
      muxAssetStatus: payload.muxAssetId ? "ready" : existing.muxAssetStatus,
      updatedAt: new Date().toISOString(),
    });
  },

  async markMuxAssetCreated(trackId: string, payload: {
    muxUploadId?: string;
    muxAssetId: string;
  }) {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    return tracksRepository.upsert({
      ...existing,
      status: "processing",
      mediaProvider: "mux",
      runtime: "Processing in Mux",
      muxUploadId: payload.muxUploadId ?? existing.muxUploadId,
      muxAssetId: payload.muxAssetId,
      muxAssetStatus: "asset_created",
      updatedAt: new Date().toISOString(),
    });
  },

  async markFailed(trackId: string, runtime = "Processing failed") {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    return tracksRepository.upsert({
      ...existing,
      status: "failed",
      runtime,
      muxAssetStatus: existing.mediaProvider === "mux" ? "errored" : existing.muxAssetStatus,
      playbackReady: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async markArchiveReady(trackId: string) {
    const existing = await tracksRepository.findById(trackId);

    if (!existing) {
      throw new Error("Track not found");
    }

    return tracksRepository.upsert({
      ...existing,
      archiveStatus: "ready",
      updatedAt: new Date().toISOString(),
    });
  },
};
