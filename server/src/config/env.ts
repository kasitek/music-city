import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

const workspaceEnvPath = resolve(process.cwd(), "..", ".env");
const localEnvPath = resolve(process.cwd(), ".env");

if (existsSync(localEnvPath)) {
  loadEnv({ path: localEnvPath });
} else if (existsSync(workspaceEnvPath)) {
  loadEnv({ path: workspaceEnvPath });
} else {
  loadEnv();
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  ADMIN_CLIENT_ORIGIN: z.string().default("http://localhost:3001"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().default("music-city-dev-secret"),
  ADMIN_JWT_SECRET: z.string().default("music-city-admin-secret"),
  STELLAR_NETWORK_PASSPHRASE: z
    .string()
    .default("Test SDF Network ; September 2015"),
  STELLAR_HOME_DOMAIN: z.string().default("localhost"),
  STELLAR_WEB_AUTH_DOMAIN: z.string().default("localhost:4000"),
  STELLAR_SEP10_SECRET: z.string().optional(),
  APP_BASE_URL: z.string().default("http://localhost:4000"),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_BUCKET: z.string().default("music-city-dev"),
  STORAGE_REGION: z.string().default("auto"),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_PUBLIC_BASE_URL: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_PATH_STYLE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  LOCAL_MEDIA_ROOT: z.string().default("server/data/media"),
  PLAYBACK_TOKEN_SECRET: z.string().default("music-city-playback-secret"),
  DYNAMIC_ENVIRONMENT_ID: z.string().optional(),
  DYNAMIC_JWKS_URL: z.string().optional(),
  STELLAR_HORIZON_URL: z.string().default("https://horizon-testnet.stellar.org"),
  STELLAR_ACCESS_ASSET_CODE: z.string().optional(),
  STELLAR_ACCESS_ASSET_ISSUER: z.string().optional(),
  STELLAR_TREASURY_ADDRESS: z.string().optional(),
  STELLAR_SETTLEMENT_ASSET_CODE: z.string().default("XLM"),
  STELLAR_SETTLEMENT_ASSET_ISSUER: z.string().optional(),
  TRACK_PURCHASE_DEFAULT_PRICE: z.string().default("5"),
  ARTIST_SUBSCRIPTION_DEFAULT_PRICE: z.string().default("10"),
  ARTIST_SUBSCRIPTION_PERIOD_DAYS: z.coerce.number().int().positive().default(30),
  PLATFORM_SUBSCRIPTION_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  PLATFORM_SUBSCRIPTION_NAME: z.string().default("Music City Pass"),
  PLATFORM_SUBSCRIPTION_DESCRIPTION: z
    .string()
    .default("One subscription unlocks every subscriber-only release across Music City."),
  PLATFORM_SUBSCRIPTION_PRICE: z.string().default("15"),
  PLATFORM_SUBSCRIPTION_ASSET_CODE: z.string().default("XLM"),
  PLATFORM_SUBSCRIPTION_ASSET_ISSUER: z.string().optional(),
  PLATFORM_SUBSCRIPTION_PERIOD_DAYS: z.coerce.number().int().positive().default(30),
  ARCHIVE_OUTPUT_ROOT: z.string().default("server/data/archives"),
  ARCHIVE_MASTER_KEY: z.string().optional(),
  ARCHIVE_REMOTE_UPLOAD_URL: z.string().optional(),
  ARCHIVE_REMOTE_UPLOAD_TOKEN: z.string().optional(),
  MEDIA_PROVIDER: z.enum(["local", "mux"]).default("local"),
  MUX_TOKEN_ID: z.string().optional(),
  MUX_TOKEN_SECRET: z.string().optional(),
  MUX_WEBHOOK_SECRET: z.string().optional(),
  MUX_SIGNING_KEY: z.string().optional(),
  MUX_PRIVATE_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
