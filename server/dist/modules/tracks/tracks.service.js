import { trackCreateSchema } from "@music-city/shared";
import { createId } from "../../services/id.service.js";
import { usersService } from "../users/users.service.js";
import { tracksRepository } from "./tracks.repository.js";
export const tracksService = {
    listTracks() {
        return tracksRepository.list();
    },
    listMyTracks(walletAddress) {
        const profile = usersService.getProfile(walletAddress);
        if (!profile) {
            return [];
        }
        return tracksRepository.listByArtist(profile.id);
    },
    getTrack(trackId) {
        return tracksRepository.findById(trackId);
    },
    userOwnsTrack(walletAddress, trackId) {
        const profile = usersService.getProfile(walletAddress);
        const track = tracksRepository.findById(trackId);
        return Boolean(profile && track && track.artistId === profile.id);
    },
    createTrack(walletAddress, input) {
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
            playbackReady: false,
            archiveStatus: "not_requested",
            createdAt: timestamp,
            updatedAt: timestamp,
        });
        return track;
    },
    attachMaster(trackId, payload) {
        const existing = tracksRepository.findById(trackId);
        if (!existing) {
            throw new Error("Track not found");
        }
        return tracksRepository.upsert({
            ...existing,
            status: "uploaded",
            runtime: "Uploaded",
            masterStorageKey: payload.masterStorageKey,
            streamManifestKey: `virtual/${trackId}/master.m3u8`,
            sourceFileName: payload.sourceFileName,
            sourceContentType: payload.sourceContentType,
            sourceSizeBytes: payload.sourceSizeBytes,
            playbackReady: false,
            updatedAt: new Date().toISOString(),
        });
    },
    markProcessing(trackId) {
        const existing = tracksRepository.findById(trackId);
        if (!existing) {
            throw new Error("Track not found");
        }
        return tracksRepository.upsert({
            ...existing,
            status: "processing",
            updatedAt: new Date().toISOString(),
        });
    },
    markPlaybackReady(trackId, payload) {
        const existing = tracksRepository.findById(trackId);
        if (!existing) {
            throw new Error("Track not found");
        }
        return tracksRepository.upsert({
            ...existing,
            status: "published",
            runtime: payload.runtime,
            playbackReady: true,
            playbackUrl: payload.streamMediaUrl ?? existing.playbackUrl ?? existing.streamMediaUrl,
            streamManifestUrl: payload.streamManifestUrl ?? existing.streamManifestUrl,
            streamMediaUrl: payload.streamMediaUrl ?? existing.streamMediaUrl,
            updatedAt: new Date().toISOString(),
        });
    },
    markArchiveReady(trackId) {
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
