import type Mux from "@mux/mux-node";

import { muxService } from "../../services/mux.service.js";
import { tracksService } from "../tracks/tracks.service.js";

const formatRuntime = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) {
    return "Ready";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getTrackIdFromAsset = (data: { passthrough?: string }) => {
  return data.passthrough ?? null;
};

export const mediaService = {
  async unwrapMuxWebhook(body: string, headers: Headers) {
    return muxService.unwrapWebhook(body, headers);
  },

  async handleMuxWebhook(event: Mux.Webhooks.UnwrapWebhookEvent) {
    switch (event.type) {
      case "video.upload.asset_created": {
        const trackId = event.data.new_asset_settings?.passthrough ?? null;
        const assetId = event.data.asset_id;

        if (!trackId || !assetId) {
          return null;
        }

        return tracksService.markMuxAssetCreated(trackId, {
          muxUploadId: event.data.id,
          muxAssetId: assetId,
        });
      }

      case "video.asset.ready": {
        const trackId = getTrackIdFromAsset(event.data);

        if (!trackId) {
          return null;
        }

        const playbackId = event.data.playback_ids?.[0]?.id;

        return tracksService.markPlaybackReady(trackId, {
          runtime: formatRuntime(event.data.duration),
          muxAssetId: event.data.id,
          muxPlaybackId: playbackId,
        });
      }

      case "video.asset.errored": {
        const trackId = getTrackIdFromAsset(event.data);

        if (!trackId) {
          return null;
        }

        const message =
          event.data.errors?.messages?.[0] ??
          event.data.errors?.type ??
          "Mux processing failed";

        return tracksService.markFailed(trackId, message);
      }

      case "video.upload.cancelled": {
        const trackId = event.data.new_asset_settings?.passthrough ?? null;

        if (!trackId) {
          return null;
        }

        return tracksService.markFailed(trackId, "Upload cancelled");
      }

      default:
        return null;
    }
  },
};
