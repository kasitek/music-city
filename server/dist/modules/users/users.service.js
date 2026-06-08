import { upsertUserProfileSchema, } from "@music-city/shared";
import { createId } from "../../services/id.service.js";
import { usersRepository } from "./users.repository.js";
const nowIso = () => new Date().toISOString();
export const usersService = {
    getProfile(walletAddress) {
        return usersRepository.findByWallet(walletAddress);
    },
    upsertProfile(walletAddress, input) {
        const parsed = upsertUserProfileSchema.parse(input);
        const existing = usersRepository.findByWallet(walletAddress);
        const timestamp = nowIso();
        const profile = {
            id: existing?.id ?? createId("usr"),
            walletAddress,
            displayName: parsed.displayName,
            role: parsed.role,
            bio: parsed.bio ?? existing?.bio ?? "",
            location: parsed.location ?? existing?.location ?? "",
            genres: parsed.genres ?? existing?.genres ?? [],
            profileImageUrl: existing?.profileImageUrl,
            verified: existing?.verified ?? false,
            createdAt: existing?.createdAt ?? timestamp,
            updatedAt: timestamp,
        };
        return usersRepository.upsert(profile);
    },
    listArtists() {
        return usersRepository.listArtists().map((artist) => ({
            id: artist.id,
            walletAddress: artist.walletAddress,
            name: artist.displayName,
            genre: artist.genres[0] ?? "Independent",
            city: artist.location || "Remote",
            monthlyListeners: "0",
            verified: artist.verified,
        }));
    },
};
