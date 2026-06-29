import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgres://music-city:music-city@127.0.0.1:5432/music-city";

const walletAddress = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

const { tracksService } = await import("./tracks.service.js");
const { usersService } = await import("../users/users.service.js");
const { tracksRepository } = await import("./tracks.repository.js");

const restore = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  replacement: T[K],
) => {
  const original = target[key];
  target[key] = replacement;
  return () => {
    target[key] = original;
  };
};

test("createTrack allows subscriber-only access without an artist-scoped subscription plan", async () => {
  let receivedAccess: string | undefined;
  const cleanup = [
    restore(
      usersService,
      "getProfile",
      (async () => ({
        id: "artist-1",
        walletAddress,
        email: "",
        displayName: "Artist",
        role: "artist" as const,
        location: "",
        subscriptionEnabled: false,
        subscriptionPrice: "10",
        subscriptionAssetCode: "XLM",
        subscriptionAssetIssuer: undefined,
        subscriptionPeriodDays: 30,
        profileImageUrl: undefined,
        profileImageStorageKey: undefined,
        headerImageUrl: undefined,
        headerImageStorageKey: undefined,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as typeof usersService.getProfile,
    ),
    restore(
      tracksRepository,
      "upsert",
      (async (track) => {
        receivedAccess = track.access;
        return track;
      }) as typeof tracksRepository.upsert,
    ),
  ];

  try {
    const track = await tracksService.createTrack(walletAddress, {
      title: "Locked track",
      genre: "Pop",
      access: "subscribers",
    });

    assert.equal(track.access, "subscribers");
    assert.equal(receivedAccess, "subscribers");
  } finally {
    cleanup.reverse().forEach((fn) => fn());
  }
});

test("updateTrackAccess allows subscriber-only access without an artist-scoped subscription plan", async () => {
  let receivedAccess: string | undefined;
  const cleanup = [
    restore(
      usersService,
      "getProfile",
      (async () => ({
        id: "artist-1",
        walletAddress,
        email: "",
        displayName: "Artist",
        role: "artist" as const,
        location: "",
        subscriptionEnabled: false,
        subscriptionPrice: undefined,
        subscriptionAssetCode: "XLM",
        subscriptionAssetIssuer: undefined,
        subscriptionPeriodDays: 30,
        profileImageUrl: undefined,
        profileImageStorageKey: undefined,
        headerImageUrl: undefined,
        headerImageStorageKey: undefined,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as typeof usersService.getProfile,
    ),
    restore(
      tracksRepository,
      "findById",
      (async () => ({
        id: "trk-1",
        title: "Track",
        artistId: "artist-1",
        artistName: "Artist",
        genre: "Pop",
        runtime: "4:05",
        priceLabel: "Private",
        status: "published" as const,
        access: "public" as const,
        plays: 0,
        likes: 0,
        playbackReady: true,
      })) as typeof tracksRepository.findById,
    ),
    restore(
      tracksRepository,
      "upsert",
      (async (track) => {
        receivedAccess = track.access;
        return track;
      }) as typeof tracksRepository.upsert,
    ),
  ];

  try {
    const track = await tracksService.updateTrackAccess(walletAddress, "trk-1", {
      access: "subscribers",
    });

    assert.equal(track.access, "subscribers");
    assert.equal(receivedAccess, "subscribers");
  } finally {
    cleanup.reverse().forEach((fn) => fn());
  }
});
