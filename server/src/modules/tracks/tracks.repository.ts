import type { TrackSummary } from "@music-city/shared";

import { databaseService } from "../../services/database.service.js";
import { createJsonStore } from "../../services/json-store.service.js";

const store = createJsonStore<TrackSummary>("tracks");

export const tracksRepository = {
  async list() {
    if (databaseService.isEnabled()) {
      return databaseService.listPayloads<TrackSummary>("tracks");
    }

    return store.list();
  },

  async listByArtist(artistId: string) {
    if (databaseService.isEnabled()) {
      return databaseService.listTracksByArtist<TrackSummary>(artistId);
    }

    return store.list().filter((track) => track.artistId === artistId);
  },

  async findById(trackId: string) {
    if (databaseService.isEnabled()) {
      return databaseService.findPayloadById<TrackSummary>("tracks", trackId);
    }

    return store.findById(trackId);
  },

  async upsert(track: TrackSummary) {
    if (databaseService.isEnabled()) {
      await databaseService.upsertTrack(
        track.id,
        track.artistId,
        track.status,
        track.access,
        track.mediaProvider ?? null,
        track,
      );
      return track;
    }

    return store.upsert(track);
  },
};
