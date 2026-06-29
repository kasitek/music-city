import { z } from "zod";

import { positiveAmountSchema } from "./commerce.js";

export const adminRoleSchema = z.enum(["super_admin", "admin"]);
export type AdminRole = z.infer<typeof adminRoleSchema>;

export const adminSessionSchema = z.object({
  adminId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: adminRoleSchema,
  token: z.string().optional(),
});
export type AdminSession = z.infer<typeof adminSessionSchema>;

export const adminAccountSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: adminRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminAccount = z.infer<typeof adminAccountSchema>;

export const bootstrapAdminInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
});
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminInputSchema>;

export const adminLoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
export type AdminLoginInput = z.infer<typeof adminLoginInputSchema>;

export const createAdminInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
  role: adminRoleSchema.default("admin"),
});
export type CreateAdminInput = z.infer<typeof createAdminInputSchema>;

export const adminBootstrapStatusSchema = z.object({
  bootstrapRequired: z.boolean(),
});
export type AdminBootstrapStatus = z.infer<typeof adminBootstrapStatusSchema>;

export const adminPlatformSubscriptionSettingsSchema = z.object({
  enabled: z.boolean(),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  price: positiveAmountSchema,
  assetCode: z.string().trim().toUpperCase().min(1).max(12),
  assetIssuer: z.string().trim().max(80).optional().or(z.literal("")),
  periodDays: z.number().int().positive().max(3650),
});
export type AdminPlatformSubscriptionSettings = z.infer<
  typeof adminPlatformSubscriptionSettingsSchema
>;
