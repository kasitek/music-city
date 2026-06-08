import { z } from "zod";

export const entitlementSourceSchema = z.enum([
  "manual",
  "purchase",
  "subscription",
  "stellar_asset",
]);
export type EntitlementSource = z.infer<typeof entitlementSourceSchema>;

export interface EntitlementRecord {
  id: string;
  walletAddress: string;
  trackId: string;
  source: EntitlementSource;
  startsAt: string;
  endsAt?: string;
}

export const grantEntitlementSchema = z.object({
  trackId: z.string().min(1),
  source: entitlementSourceSchema.default("manual"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});
export type GrantEntitlementInput = z.infer<typeof grantEntitlementSchema>;
