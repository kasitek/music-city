import {
  adminAccountSchema,
  adminPlatformSubscriptionSettingsSchema,
  adminSessionSchema,
  bootstrapAdminInputSchema,
  createAdminInputSchema,
  adminLoginInputSchema,
  type AdminAccount,
  type AdminPlatformSubscriptionSettings,
  type AdminSession,
} from "@music-city/shared";

import { env } from "../../config/env.js";
import { databaseService } from "../../services/database.service.js";
import { createId } from "../../services/id.service.js";
import { passwordService } from "../../services/password.service.js";
import { HttpError } from "../../utils/http-error.js";

type PersistedAdminAccount = AdminAccount & {
  passwordHash: string;
};

const PLATFORM_SUBSCRIPTION_SETTINGS_KEY = "platform_subscription_settings";

const defaultPlatformSettings = (): AdminPlatformSubscriptionSettings => ({
  enabled: env.PLATFORM_SUBSCRIPTION_ENABLED,
  name: env.PLATFORM_SUBSCRIPTION_NAME,
  description: env.PLATFORM_SUBSCRIPTION_DESCRIPTION,
  price: env.PLATFORM_SUBSCRIPTION_PRICE,
  assetCode: env.PLATFORM_SUBSCRIPTION_ASSET_CODE,
  assetIssuer: env.PLATFORM_SUBSCRIPTION_ASSET_ISSUER ?? "",
  periodDays: env.PLATFORM_SUBSCRIPTION_PERIOD_DAYS,
});

const toAdminSession = (admin: PersistedAdminAccount): Omit<AdminSession, "token"> =>
  adminSessionSchema.omit({ token: true }).parse({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

const sanitizeAdmin = (admin: PersistedAdminAccount): AdminAccount =>
  adminAccountSchema.parse({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  });

export const adminService = {
  async bootstrapRequired() {
    return (await databaseService.countAdmins()) === 0;
  },

  async bootstrap(input: unknown) {
    if (!(await this.bootstrapRequired())) {
      throw new HttpError(409, "Admin bootstrap has already been completed");
    }

    const parsed = bootstrapAdminInputSchema.parse(input);
    const timestamp = new Date().toISOString();
    const admin: PersistedAdminAccount = {
      id: createId("adm"),
      email: parsed.email.trim().toLowerCase(),
      name: parsed.name.trim(),
      role: "super_admin",
      passwordHash: await passwordService.hashPassword(parsed.password),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await databaseService.upsertAdmin(admin.id, admin.email, admin.role, admin);

    return {
      admin: sanitizeAdmin(admin),
      session: toAdminSession(admin),
    };
  },

  async login(input: unknown) {
    const parsed = adminLoginInputSchema.parse(input);
    const existing = await databaseService.findAdminByEmail<PersistedAdminAccount>(
      parsed.email.trim().toLowerCase(),
    );

    if (!existing) {
      throw new HttpError(401, "Invalid email or password");
    }

    const valid = await passwordService.verifyPassword(
      parsed.password,
      existing.passwordHash,
    );

    if (!valid) {
      throw new HttpError(401, "Invalid email or password");
    }

    return {
      admin: sanitizeAdmin(existing),
      session: toAdminSession(existing),
    };
  },

  async getAdminById(adminId: string) {
    const admin = await databaseService.findAdminById<PersistedAdminAccount>(adminId);

    if (!admin) {
      throw new HttpError(404, "Admin account not found");
    }

    return sanitizeAdmin(admin);
  },

  async listAdmins() {
    const admins = await databaseService.listAdmins<PersistedAdminAccount>();
    return admins.map(sanitizeAdmin);
  },

  async createAdmin(input: unknown) {
    const parsed = createAdminInputSchema.parse(input);
    const existing = await databaseService.findAdminByEmail<PersistedAdminAccount>(
      parsed.email.trim().toLowerCase(),
    );

    if (existing) {
      throw new HttpError(409, "An admin with this email already exists");
    }

    const timestamp = new Date().toISOString();
    const admin: PersistedAdminAccount = {
      id: createId("adm"),
      email: parsed.email.trim().toLowerCase(),
      name: parsed.name.trim(),
      role: parsed.role,
      passwordHash: await passwordService.hashPassword(parsed.password),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await databaseService.upsertAdmin(admin.id, admin.email, admin.role, admin);
    return sanitizeAdmin(admin);
  },

  async getPlatformSubscriptionSettings() {
    const stored =
      await databaseService.findSetting<AdminPlatformSubscriptionSettings>(
        PLATFORM_SUBSCRIPTION_SETTINGS_KEY,
      );

    return adminPlatformSubscriptionSettingsSchema.parse(
      stored ?? defaultPlatformSettings(),
    );
  },

  async updatePlatformSubscriptionSettings(input: unknown) {
    const parsed = adminPlatformSubscriptionSettingsSchema.parse(input);
    const normalized = {
      ...parsed,
      assetIssuer: parsed.assetIssuer?.trim() || "",
    };

    await databaseService.upsertSetting(
      PLATFORM_SUBSCRIPTION_SETTINGS_KEY,
      normalized,
    );

    return normalized;
  },
};
