import { z } from "zod";

import { userRoleSchema } from "./auth.js";

export const userProfileSchema = z.object({
  id: z.string(),
  walletAddress: z.string(),
  displayName: z.string().min(1),
  role: userRoleSchema,
  bio: z.string().default(""),
  location: z.string().default(""),
  genres: z.array(z.string()).default([]),
  profileImageUrl: z.string().optional(),
  verified: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const upsertUserProfileSchema = z.object({
  displayName: z.string().min(1).max(80),
  role: userRoleSchema,
  bio: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  genres: z.array(z.string().max(40)).max(8).optional(),
});
export type UpsertUserProfileInput = z.infer<typeof upsertUserProfileSchema>;
