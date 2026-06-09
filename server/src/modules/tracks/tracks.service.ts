import { trackCreateSchema, type TrackCreateInput } from "@music-city/shared";

import { createId } from "../../services/id.service.js";
import { usersService } from "../users/users.service.js";
import { tracksRepository } from "./tracks.repository.js";

export const tracksService = {
  listTracks() {
    return tracksRepository.list();
  },

  listMyTracks(walletAddress: string) {
    const profile = usersService.getProfile(walletAddress);

    if (!profile) {
      return [];
    }

    return tracksRepository.listByArtist(profile.id);
  },

  getTrack(trackId: string) {
    return tracksRepository.findById(trackId);
  },

  userOwnsTrack(walletAddress: string, trackId: string) {
    const profile = usersService.getProfile(walletAddress);
    const track = tracksRepository.findById(trackId);

    return Boolean(profile && track && track.artistId === profile.id);
  },

  createTrack(walletAddress: string, input: TrackCreateInput) {
    const profile = usersService.getProfile(walletAddress);

    if (!profile) {
      throw new Error("Create a profile before creating tracks");
    }

    const timestamp = new Date().toISOString();
    const parsed = trackCreateSchema.parse(input);
    const track = tracksRepository.upsert({
      id: createId("trk"),
      title: parsed.title,
      artistId: profile.id,
      artistName: profile.displayName,
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

  attachMaster(trackId: string, payload: {
    masterStorageKey: string;
    sourceFileName: string;
    sourceContentType: string;
    sourceSizeBytes: number;
  }) {
    const existing = tracksRepository.findById(trackId);

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

  attachMuxUpload(trackId: string, payload: {
    muxUploadId: string;
    sourceFileName: string;
    sourceContentType: string;
    sourceSizeBytes: number;
  }) {
    const existing = tracksRepository.findById(trackId);

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

  markProcessing(trackId: string) {
    const existing = tracksRepository.findById(trackId);

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

  markPlaybackReady(trackId: string, payload: {
    runtime: string;
    streamManifestUrl?: string;
    streamMediaUrl?: string;
    muxAssetId?: string;
    muxPlaybackId?: string;
  }) {
    const existing = tracksRepository.findById(trackId);

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

  markMuxAssetCreated(trackId: string, payload: {
    muxUploadId?: string;
    muxAssetId: string;
  }) {
    const existing = tracksRepository.findById(trackId);

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

  markFailed(trackId: string, runtime = "Processing failed") {
    const existing = tracksRepository.findById(trackId);

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

  markArchiveReady(trackId: string) {
    const existing = tracksRepository.findById(trackId);

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
