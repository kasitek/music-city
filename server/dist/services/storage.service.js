import { createHash, createHmac } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
const encodeRfc3986 = (value) => encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
const sha256Hex = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const hmac = (key, value) => createHmac("sha256", key).update(value, "utf8").digest();
const getSigningKey = (date, region, service) => {
    const kDate = hmac(`AWS4${env.STORAGE_SECRET_ACCESS_KEY ?? ""}`, date);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    return hmac(kService, "aws4_request");
};
const ensureParent = (filePath) => {
    mkdirSync(dirname(filePath), { recursive: true });
};
const localMediaPath = (storageKey) => join(process.cwd(), env.LOCAL_MEDIA_ROOT, storageKey);
const inferMimeType = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
        case "mp3":
            return "audio/mpeg";
        case "wav":
            return "audio/wav";
        case "m4a":
            return "audio/mp4";
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        default:
            return "application/octet-stream";
    }
};
const storageBaseUrl = () => {
    if (env.STORAGE_PUBLIC_BASE_URL) {
        return env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "");
    }
    if (!env.STORAGE_ENDPOINT) {
        throw new HttpError(500, "STORAGE_ENDPOINT is required for S3 storage");
    }
    return env.STORAGE_ENDPOINT.replace(/\/$/, "");
};
const buildS3PresignedUrl = ({ method, storageKey, expiresInSeconds, }) => {
    if (!env.STORAGE_ACCESS_KEY_ID ||
        !env.STORAGE_SECRET_ACCESS_KEY ||
        !env.STORAGE_ENDPOINT) {
        throw new HttpError(500, "S3-compatible storage credentials are not fully configured");
    }
    const endpoint = new URL(storageBaseUrl());
    const host = endpoint.host;
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const shortDate = amzDate.slice(0, 8);
    const credentialScope = `${shortDate}/${env.STORAGE_REGION}/s3/aws4_request`;
    const objectPath = env.STORAGE_PATH_STYLE
        ? `/${env.STORAGE_BUCKET}/${storageKey}`
        : `/${storageKey}`;
    const query = new URLSearchParams({
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": `${env.STORAGE_ACCESS_KEY_ID}/${credentialScope}`,
        "X-Amz-Date": amzDate,
        "X-Amz-Expires": String(expiresInSeconds),
        "X-Amz-SignedHeaders": "host",
    });
    const canonicalRequest = [
        method,
        objectPath,
        query.toString(),
        `host:${host}\n`,
        "host",
        "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        credentialScope,
        sha256Hex(canonicalRequest),
    ].join("\n");
    const signature = createHmac("sha256", getSigningKey(shortDate, env.STORAGE_REGION, "s3"))
        .update(stringToSign, "utf8")
        .digest("hex");
    query.set("X-Amz-Signature", signature);
    const origin = env.STORAGE_PATH_STYLE
        ? endpoint.origin
        : `${endpoint.protocol}//${env.STORAGE_BUCKET}.${host}`;
    const finalPath = env.STORAGE_PATH_STYLE ? objectPath : `/${storageKey}`;
    return `${origin}${finalPath}?${query.toString()}`;
};
export const storageService = {
    createUploadTarget(storageKey) {
        if (env.STORAGE_PROVIDER === "local") {
            return {
                uploadUrl: `${env.APP_BASE_URL}/api/v1/uploads/content/${encodeURIComponent(storageKey)}`,
                method: "PUT",
                headers: {},
                provider: "local",
            };
        }
        return {
            uploadUrl: buildS3PresignedUrl({
                method: "PUT",
                storageKey,
                expiresInSeconds: 900,
            }),
            method: "PUT",
            headers: {},
            provider: "s3",
        };
    },
    async saveLocalObject(storageKey, body) {
        const filePath = localMediaPath(storageKey);
        ensureParent(filePath);
        await new Promise((resolve, reject) => {
            const stream = createWriteStream(filePath);
            body.pipe(stream);
            body.on("error", reject);
            stream.on("error", reject);
            stream.on("finish", () => resolve());
        });
        return filePath;
    },
    localObjectExists(storageKey) {
        return existsSync(localMediaPath(storageKey));
    },
    async getObjectMetadata(storageKey, fallbackFileName) {
        const filePath = localMediaPath(storageKey);
        const stats = await stat(filePath);
        return {
            sizeBytes: stats.size,
            contentType: inferMimeType(fallbackFileName ?? filePath),
            filePath,
        };
    },
    createReadStream(storageKey, start, end) {
        return createReadStream(localMediaPath(storageKey), {
            start,
            end,
        });
    },
    readObject(storageKey) {
        return readFileSync(localMediaPath(storageKey));
    },
    getLocalPath(storageKey) {
        return localMediaPath(storageKey);
    },
    getDownloadUrl(storageKey) {
        if (env.STORAGE_PROVIDER === "local") {
            return `${env.APP_BASE_URL}/api/v1/uploads/content/${encodeURIComponent(storageKey)}`;
        }
        return buildS3PresignedUrl({
            method: "GET",
            storageKey,
            expiresInSeconds: 300,
        });
    },
};
