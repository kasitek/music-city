import { z } from "zod";

export const userRoleSchema = z.enum(["artist", "fan"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const authSessionSchema = z.object({
  walletAddress: z.string(),
  displayName: z.string().min(1),
  role: userRoleSchema,
  token: z.string().optional(),
  profileComplete: z.boolean().default(false),
});
export type AuthSession = z.infer<typeof authSessionSchema>;

export const challengeRequestSchema = z.object({
  account: z.string().min(1),
});
export type ChallengeRequest = z.infer<typeof challengeRequestSchema>;

export const challengeResponseSchema = z.object({
  transaction: z.string(),
  networkPassphrase: z.string(),
});
export type ChallengeResponse = z.infer<typeof challengeResponseSchema>;

export const verifyChallengeSchema = z.object({
  transaction: z.string().min(1),
});
export type VerifyChallengeRequest = z.infer<typeof verifyChallengeSchema>;

export const dynamicSessionRequestSchema = z.object({
  walletAddress: z.string().optional(),
});
export type DynamicSessionRequest = z.infer<typeof dynamicSessionRequestSchema>;
