import "dotenv/config";
import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().default(4000),
    CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
    JWT_SECRET: z.string().default("music-city-dev-secret"),
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
    STELLAR_HORIZON_URL: z.string().default("https://horizon-testnet.stellar.org"),
    STELLAR_ACCESS_ASSET_CODE: z.string().optional(),
    STELLAR_ACCESS_ASSET_ISSUER: z.string().optional(),
    ARCHIVE_OUTPUT_ROOT: z.string().default("server/data/archives"),
    ARCHIVE_MASTER_KEY: z.string().optional(),
    ARCHIVE_REMOTE_UPLOAD_URL: z.string().optional(),
    ARCHIVE_REMOTE_UPLOAD_TOKEN: z.string().optional(),
    MEDIA_PIPELINE_PROVIDER: z.enum(["local", "external"]).default("local"),
    MEDIA_PIPELINE_INGEST_URL: z.string().optional(),
    MEDIA_PIPELINE_API_TOKEN: z.string().optional(),
    MEDIA_PIPELINE_WEBHOOK_SECRET: z.string().optional(),
});
export const env = envSchema.parse(process.env);
