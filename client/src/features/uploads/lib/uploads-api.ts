import type {
  CompleteUploadSessionInput,
  CreateUploadSessionInput,
  TrackSummary,
  UploadSession,
} from "@music-city/shared";
import * as UpChunk from "@mux/upchunk";

import { httpClient } from "@/lib/api/http-client";

export const uploadsApi = {
  async createSession(token: string, input: CreateUploadSessionInput) {
    const response = await httpClient.post<{ uploadSession: UploadSession }>(
      "/uploads/sessions",
      input,
      token,
    );

    return response.uploadSession;
  },

  async uploadFile(uploadSession: UploadSession, file: File) {
    if (uploadSession.provider === "mux") {
      await new Promise<void>((resolve, reject) => {
        const upload = UpChunk.createUpload({
          endpoint: uploadSession.uploadUrl,
          file,
          chunkSize: 5120,
          dynamicChunkSize: true,
        });

        upload.on("error", (error) => {
          reject(error.detail ?? new Error("Mux upload failed"));
        });

        upload.on("success", () => {
          resolve();
        });
      });

      return undefined;
    }

    const response = await fetch(uploadSession.uploadUrl, {
      method: uploadSession.method,
      headers: uploadSession.headers,
      body: file,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    return response.headers.get("etag") ?? undefined;
  },

  async completeSession(
    token: string,
    uploadSessionId: string,
    input: CompleteUploadSessionInput,
  ) {
    const response = await httpClient.post<{ track: TrackSummary }>(
      `/uploads/sessions/${uploadSessionId}/complete`,
      input,
      token,
    );

    return response.track;
  },
};
