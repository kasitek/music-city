# Storage Implementation Plan

## Goal

Move media storage and playback off the current canister-backed path and onto a production-oriented storage stack:

- Original masters: private `S3`/`R2` bucket
- Streaming files: encrypted `HLS` renditions in `S3`/`R2`
- Access: `CDN` signed URLs and short-lived playback tokens
- Permissions: `Stellar`/`Soroban` ownership plus backend entitlement checks
- Archive option: optional encrypted `Arweave` backup per release

This keeps blockchain usage narrow and correct:

- `Stellar`/`Soroban` handles payment, ownership, licensing, and entitlement facts
- the backend handles policy enforcement
- object storage and CDN handle actual media delivery

## Current Repo Context

The repo has been restructured into a workspace:

- `client/` for the Next.js frontend
- `server/` for the standalone Node.js backend
- `packages/shared/` for shared DTOs and schemas

The old canister-backed runtime path has been removed from the active app. Storage work should now land directly in the `server` modules and the `client` API layer.

## Target Architecture

```text
artist upload
  -> backend receives upload session request
  -> original master stored in private S3/R2 bucket
  -> transcode job creates encrypted HLS renditions
  -> HLS manifest + segments stored in streaming bucket/prefix
  -> backend records asset metadata and entitlement rules
  -> playback request checks SEP-10 session + Stellar/Soroban entitlement
  -> backend issues short-lived playback token or signed CDN URL
  -> client streams encrypted HLS

optional archival path
  -> release package encrypted with per-release data key
  -> encrypted archive uploaded to Arweave
  -> wrapped archive key and Arweave transaction id stored in app database
```

## Storage Layout

### 1. Original Masters

Store original uploaded files in a private bucket.

Suggested key layout:

```text
masters/{artistId}/{releaseId}/{trackId}/source.wav
masters/{artistId}/{releaseId}/{trackId}/artwork.png
```

Rules:

- no public access
- backend-only read/write
- retain original file for retranscode and recovery
- enable versioning

### 2. Streaming Renditions

Store HLS manifests and encrypted segments separately from masters.

Suggested key layout:

```text
stream/{artistId}/{releaseId}/{trackId}/{version}/master.m3u8
stream/{artistId}/{releaseId}/{trackId}/{version}/audio-128/index.m3u8
stream/{artistId}/{releaseId}/{trackId}/{version}/audio-128/segment-0001.m4s
stream/{artistId}/{releaseId}/{trackId}/{version}/audio-256/index.m3u8
stream/{artistId}/{releaseId}/{trackId}/{version}/audio-256/segment-0001.m4s
```

Rules:

- encrypted at rest in object storage
- HLS segment encryption enabled during packaging
- only accessible through signed playback flow
- version every re-encode or key rotation

### 3. Optional Arweave Archive

Use Arweave only for releases that explicitly need permanence.

Archive payload examples:

- encrypted release zip
- encrypted master bundle
- public cover art and public metadata when permanence is intended

Rules:

- never use Arweave as the default private streaming origin
- encrypt archive before upload
- use a per-release archive key, not a global key
- store only ciphertext on Arweave

## Encryption Model

Use envelope encryption.

- one `KMS` master key for wrapping
- one data encryption key per track version for HLS assets
- one data encryption key per release archive for Arweave backups
- store only wrapped keys in the database

This limits blast radius:

- leaked track key exposes one track version
- leaked archive key exposes one archived release
- database leak does not expose plaintext keys

Do not use one global media decryption key.

## Access Control Model

### Authentication

- wallet auth through `SEP-10`
- backend issues session token after challenge verification

### Authorization

Backend checks:

- does the user wallet own the track or release
- does the wallet hold the required token or access pass
- does the user have an active purchase or subscription
- is the content regionally or contractually restricted

### Playback

Backend returns one of:

- signed manifest URL with short TTL
- playback token exchanged by an edge/media endpoint

Rules:

- do not expose long-lived public asset URLs
- do not persist plaintext media keys in the browser
- rate-limit manifest/token issuance
- log playback grants for auditability

## Data Model

Minimum backend tables or collections:

### `tracks`

- `id`
- `artist_id`
- `release_id`
- `title`
- `status`
- `master_storage_key`
- `duration_ms`
- `created_at`

### `track_renditions`

- `id`
- `track_id`
- `version`
- `bitrate`
- `codec`
- `manifest_storage_key`
- `encryption_scheme`
- `wrapped_data_key`
- `created_at`

### `release_archives`

- `id`
- `release_id`
- `archive_type`
- `arweave_tx_id`
- `wrapped_archive_key`
- `checksum`
- `created_at`

### `entitlements`

- `id`
- `user_wallet`
- `track_id` or `release_id`
- `source`
- `starts_at`
- `ends_at`

### `playback_sessions`

- `id`
- `user_wallet`
- `track_id`
- `rendition_version`
- `expires_at`
- `token_hash`
- `created_at`

## Implementation Phases

### Phase 1: Backend Foundation

- [ ] Choose storage provider: `Cloudflare R2` or `AWS S3`
- [ ] Add backend service for object storage operations
- [ ] Add database schema for tracks, renditions, archives, entitlements, and playback sessions
- [ ] Add `SEP-10` session verification flow
- [ ] Define Stellar/Soroban entitlement model for purchases and access

### Phase 2: Upload and Master Storage

- [ ] Build upload session endpoint
- [ ] Store original masters in private bucket
- [ ] Validate MIME type, duration, and file size
- [ ] Add checksuming and upload completion tracking
- [ ] Persist master asset records in database

### Phase 3: Transcoding and HLS Packaging

- [ ] Add async transcode worker
- [ ] Generate AAC HLS renditions
- [ ] Encrypt HLS segments during packaging
- [ ] Upload manifests and segments to streaming bucket/prefix
- [ ] Wrap and store per-track-version data keys

### Phase 4: Playback Authorization

- [ ] Add entitlement-check endpoint using Stellar/Soroban-backed rules
- [ ] Add short-lived playback token issuance
- [ ] Add CDN signed URL generation for manifests and segments
- [ ] Update web player to request playback sessions before streaming
- [ ] Reject playback when entitlement is missing or expired

### Phase 5: Arweave Archive Option

- [ ] Add release-level archive packaging flow
- [ ] Encrypt archive bundle with per-release key
- [ ] Upload encrypted archive to Arweave
- [ ] Store transaction id, checksum, and wrapped key
- [ ] Expose archive status in artist/release management UI

### Phase 6: Frontend and API Integration

- [ ] Add a storage-aware upload module under `server/src/modules/uploads`
- [ ] Add a playback session module under `server/src/modules/playback`
- [ ] Switch `client/src/app/dashboard/page.tsx` to the backend upload flow
- [ ] Switch `client/src/app/stream/page.tsx` to signed HLS playback
- [ ] Move any temporary mock catalog data to real backend queries

## Repo Integration Notes

These areas are likely to change during implementation:

- frontend upload flow in [client/src/app/dashboard/page.tsx](/home/enoch/aworkspace/clients/music-city/client/src/app/dashboard/page.tsx)
- frontend playback flow in [client/src/app/stream/page.tsx](/home/enoch/aworkspace/clients/music-city/client/src/app/stream/page.tsx)
- frontend auth flow in [client/src/features/auth/providers/auth-provider.tsx](/home/enoch/aworkspace/clients/music-city/client/src/features/auth/providers/auth-provider.tsx)
- backend auth flow in [server/src/modules/auth/auth.router.ts](/home/enoch/aworkspace/clients/music-city/server/src/modules/auth/auth.router.ts)
- backend storage and playback modules that still need to be added under [server/src/modules](/home/enoch/aworkspace/clients/music-city/server/src/modules)

## Non-Goals

- storing audio directly on-chain
- using Arweave as the default streaming origin
- using one global decryption key for all catalog media
- exposing permanent public URLs for private tracks

## Decision Summary

Adopt this storage model:

- original masters in private `S3`/`R2`
- encrypted `HLS` streaming renditions in `S3`/`R2`
- `CDN` signed URLs and short-lived playback tokens
- `Stellar`/`Soroban` as the source of truth for access rights
- backend entitlement checks as the enforcement layer
- optional encrypted `Arweave` archive per release
