# music-city

Music City is now organized as a small workspace:

- `client`: Next.js frontend
- `server`: Node.js + TypeScript + Express backend
- `packages/shared`: shared types and schemas

The active stack is Stellar-oriented. Old ICP/canister runtime code has been removed from the app path.

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm dev:server
pnpm dev:client
```

## What works now

- Stellar wallet auth flow scaffold with server-issued sessions
- persistent user profiles and artist listing
- track creation
- upload session creation
- local file uploads or S3-compatible presigned upload mode
- upload completion that attaches media to the track
- playback session creation
- generated HLS-style manifest endpoint for uploaded audio
- optional external media processing submission + completion webhook
- local entitlement records and optional Stellar asset-based subscriber gate
- encrypted archive generation with optional remote archive upload hook

Server state persists to `server/data/*.json`.

## Service configuration

Use `STORAGE_PROVIDER=local` for local development.

Use `STORAGE_PROVIDER=s3` when you want R2, B2, S3, or another S3-compatible provider, and set:

- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`
- `STORAGE_REGION`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- `STORAGE_PUBLIC_BASE_URL` if you want a fixed public/CDN base

Use `MEDIA_PIPELINE_PROVIDER=external` when you want a managed transcoder. Then set:

- `MEDIA_PIPELINE_INGEST_URL`
- `MEDIA_PIPELINE_API_TOKEN`
- `MEDIA_PIPELINE_WEBHOOK_SECRET`

The external service should accept a POST job payload and call back to:

- `POST /api/v1/media/webhooks/complete`

with `trackId`, and optionally `runtime`, `manifestUrl`, and `mediaUrl`.
