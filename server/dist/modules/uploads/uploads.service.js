import { completeUploadSessionSchema, createUploadSessionSchema, } from "@music-city/shared";
import { createId } from "../../services/id.service.js";
import { env } from "../../config/env.js";
import { mediaService } from "../media/media.service.js";
import { storageService } from "../../services/storage.service.js";
import { tracksService } from "../tracks/tracks.service.js";
import { uploadsRepository } from "./uploads.repository.js";
const expiresInMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000).toISOString();
const sanitizeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
export const uploadsService = {
    createSession(input) {
        const parsed = createUploadSessionSchema.parse(input);
        const id = createId("upl");
        const storageKey = `masters/${parsed.trackId}/${id}-${sanitizeFileName(parsed.fileName)}`;
        const target = storageService.createUploadTarget(storageKey);
        const session = {
            id,
            trackId: parsed.trackId,
            storageKey,
            uploadUrl: target.uploadUrl,
            method: target.method,
            headers: target.headers,
            provider: target.provider,
            expiresAt: expiresInMinutes(15),
        };
        return uploadsRepository.upsert(session);
    },
    getSession(id) {
        return uploadsRepository.findById(id);
    },
    completeSession(input) {
        const parsed = completeUploadSessionSchema.parse(input);
        const session = uploadsRepository.findById(parsed.uploadSessionId);
        if (!session) {
            throw new Error("Upload session not found");
        }
        if (session.provider === "local" && !storageService.localObjectExists(session.storageKey)) {
            throw new Error("Uploaded file is missing");
        }
        const fileName = session.storageKey.split("/").pop() ?? session.storageKey;
        return storageService
            .getObjectMetadata(session.storageKey, fileName)
            .then(async (metadata) => {
            const track = tracksService.attachMaster(session.trackId, {
                masterStorageKey: session.storageKey,
                sourceFileName: fileName,
                sourceContentType: metadata.contentType,
                sourceSizeBytes: metadata.sizeBytes,
            });
            if (env.MEDIA_PIPELINE_PROVIDER === "external") {
                return mediaService.submitTrack(track.id);
            }
            return tracksService.markPlaybackReady(track.id, {
                runtime: "Ready",
                streamMediaUrl: storageService.getDownloadUrl(track.masterStorageKey),
                streamManifestUrl: `/api/v1/playback/tracks/${track.id}/manifest.m3u8`,
            });
        });
    },
};
