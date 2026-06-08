import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";
import { tracksService } from "../tracks/tracks.service.js";
export const mediaService = {
    async submitTrack(trackId) {
        const track = tracksService.getTrack(trackId);
        if (!track?.masterStorageKey) {
            throw new HttpError(404, "Track media is not available");
        }
        if (env.MEDIA_PIPELINE_PROVIDER !== "external") {
            return track;
        }
        if (!env.MEDIA_PIPELINE_INGEST_URL) {
            throw new HttpError(500, "MEDIA_PIPELINE_INGEST_URL is required for external media processing");
        }
        const response = await fetch(env.MEDIA_PIPELINE_INGEST_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(env.MEDIA_PIPELINE_API_TOKEN
                    ? { Authorization: `Bearer ${env.MEDIA_PIPELINE_API_TOKEN}` }
                    : {}),
            },
            body: JSON.stringify({
                trackId: track.id,
                title: track.title,
                sourceUrl: track.playbackUrl,
                storageKey: track.masterStorageKey,
                artistId: track.artistId,
            }),
        });
        if (!response.ok) {
            throw new HttpError(502, "External media pipeline submission failed");
        }
        return tracksService.markProcessing(track.id);
    },
    verifyWebhook(secret) {
        if (!env.MEDIA_PIPELINE_WEBHOOK_SECRET) {
            return true;
        }
        return secret === env.MEDIA_PIPELINE_WEBHOOK_SECRET;
    },
    completeTrack(input) {
        return tracksService.markPlaybackReady(input.trackId, {
            runtime: input.runtime ?? "Ready",
            streamManifestUrl: input.manifestUrl,
            streamMediaUrl: input.mediaUrl,
        });
    },
};
