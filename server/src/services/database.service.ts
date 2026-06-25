import { Pool } from "pg";

import { env } from "../config/env.js";

type PersistedRow = {
  id: string;
  payload: unknown;
};

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    payload JSONB NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    status TEXT NOT NULL,
    access TEXT NOT NULL,
    media_provider TEXT,
    payload JSONB NOT NULL,
    CONSTRAINT tracks_artist_id_fk
      FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT tracks_status_check
      CHECK (status IN ('draft', 'awaiting_upload', 'uploaded', 'processing', 'published', 'failed')),
    CONSTRAINT tracks_access_check
      CHECK (access IN ('private', 'subscribers', 'purchase_required', 'public')),
    CONSTRAINT tracks_media_provider_check
      CHECK (media_provider IS NULL OR media_provider IN ('local', 'mux'))
  )`,
  `CREATE TABLE IF NOT EXISTS upload_sessions (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    CONSTRAINT upload_sessions_track_id_fk
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    CONSTRAINT upload_sessions_provider_check
      CHECK (provider IN ('local', 's3', 'mux'))
  )`,
  `CREATE TABLE IF NOT EXISTS playback_sessions (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    CONSTRAINT playback_sessions_track_id_fk
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    CONSTRAINT playback_sessions_provider_check
      CHECK (provider IN ('local', 'mux'))
  )`,
  `CREATE TABLE IF NOT EXISTS entitlements (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    track_id TEXT NOT NULL,
    source TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    payload JSONB NOT NULL,
    CONSTRAINT entitlements_track_id_fk
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    CONSTRAINT entitlements_source_check
      CHECK (source IN ('manual', 'purchase', 'subscription', 'stellar_asset'))
  )`,
  `CREATE TABLE IF NOT EXISTS archives (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    CONSTRAINT archives_track_id_fk
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS payment_intents (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    product_type TEXT NOT NULL,
    track_id TEXT,
    artist_id TEXT,
    status TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    CONSTRAINT payment_intents_track_id_fk
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    CONSTRAINT payment_intents_artist_id_fk
      FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT payment_intents_product_type_check
      CHECK (product_type IN ('track_purchase', 'artist_subscription')),
    CONSTRAINT payment_intents_status_check
      CHECK (status IN ('pending', 'confirmed', 'expired', 'failed'))
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    intent_id TEXT NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    product_type TEXT NOT NULL,
    track_id TEXT,
    artist_id TEXT,
    confirmed_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    CONSTRAINT payments_intent_id_fk
      FOREIGN KEY (intent_id) REFERENCES payment_intents(id) ON DELETE CASCADE,
    CONSTRAINT payments_track_id_fk
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    CONSTRAINT payments_artist_id_fk
      FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT payments_product_type_check
      CHECK (product_type IN ('track_purchase', 'artist_subscription'))
  )`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    artist_id TEXT NOT NULL,
    status TEXT NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    CONSTRAINT subscriptions_artist_id_fk
      FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT subscriptions_status_check
      CHECK (status IN ('active', 'expired', 'cancelled'))
  )`,
  "CREATE INDEX IF NOT EXISTS users_wallet_address_idx ON users (wallet_address)",
  "CREATE INDEX IF NOT EXISTS users_role_idx ON users (role)",
  "CREATE INDEX IF NOT EXISTS tracks_artist_id_idx ON tracks (artist_id)",
  "CREATE INDEX IF NOT EXISTS tracks_status_idx ON tracks (status)",
  "CREATE INDEX IF NOT EXISTS upload_sessions_track_id_idx ON upload_sessions (track_id)",
  "CREATE INDEX IF NOT EXISTS playback_sessions_track_id_idx ON playback_sessions (track_id)",
  "CREATE INDEX IF NOT EXISTS entitlements_wallet_address_idx ON entitlements (wallet_address)",
  "CREATE INDEX IF NOT EXISTS entitlements_track_id_idx ON entitlements (track_id)",
  "CREATE INDEX IF NOT EXISTS archives_track_id_idx ON archives (track_id)",
  "CREATE INDEX IF NOT EXISTS payment_intents_wallet_address_idx ON payment_intents (wallet_address)",
  "CREATE INDEX IF NOT EXISTS payment_intents_track_id_idx ON payment_intents (track_id)",
  "CREATE INDEX IF NOT EXISTS payment_intents_artist_id_idx ON payment_intents (artist_id)",
  "CREATE INDEX IF NOT EXISTS payments_wallet_address_idx ON payments (wallet_address)",
  "CREATE INDEX IF NOT EXISTS subscriptions_wallet_address_idx ON subscriptions (wallet_address)",
  "CREATE INDEX IF NOT EXISTS subscriptions_artist_id_idx ON subscriptions (artist_id)",
];

const mapPayloadRows = <T>(rows: PersistedRow[]) =>
  rows.map((row) => row.payload as T);

export const databaseService = {
  async initialize() {
    for (const statement of createTableStatements) {
      await pool.query(statement);
    }
  },

  async countRows(table: string) {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${table}`,
    );

    return Number(result.rows[0]?.count ?? "0");
  },

  async listPayloads<T>(table: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM ${table} ORDER BY id`,
    );

    return mapPayloadRows<T>(result.rows);
  },

  async findPayloadById<T>(table: string, id: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM ${table} WHERE id = $1 LIMIT 1`,
      [id],
    );

    return result.rows[0]?.payload as T | null;
  },

  async upsertUser(
    id: string,
    walletAddress: string,
    role: string,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO users (id, wallet_address, role, payload)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         wallet_address = EXCLUDED.wallet_address,
         role = EXCLUDED.role,
         payload = EXCLUDED.payload`,
      [id, walletAddress, role, JSON.stringify(payload)],
    );
  },

  async findUserByWallet<T>(walletAddress: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM users WHERE wallet_address = $1 LIMIT 1`,
      [walletAddress],
    );

    return result.rows[0]?.payload as T | null;
  },

  async listUsersByRole<T>(role: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM users WHERE role = $1 ORDER BY id`,
      [role],
    );

    return mapPayloadRows<T>(result.rows);
  },

  async findUserById<T>(id: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );

    return result.rows[0]?.payload as T | null;
  },

  async upsertTrack(
    id: string,
    artistId: string,
    status: string,
    access: string,
    mediaProvider: string | null,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO tracks (id, artist_id, status, access, media_provider, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         artist_id = EXCLUDED.artist_id,
         status = EXCLUDED.status,
         access = EXCLUDED.access,
         media_provider = EXCLUDED.media_provider,
         payload = EXCLUDED.payload`,
      [id, artistId, status, access, mediaProvider, JSON.stringify(payload)],
    );
  },

  async listTracksByArtist<T>(artistId: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM tracks WHERE artist_id = $1 ORDER BY id`,
      [artistId],
    );

    return mapPayloadRows<T>(result.rows);
  },

  async deleteTrack(id: string) {
    await pool.query(`DELETE FROM tracks WHERE id = $1`, [id]);
  },

  async upsertUploadSession(
    id: string,
    trackId: string,
    provider: string,
    expiresAt: string,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO upload_sessions (id, track_id, provider, expires_at, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         track_id = EXCLUDED.track_id,
         provider = EXCLUDED.provider,
         expires_at = EXCLUDED.expires_at,
         payload = EXCLUDED.payload`,
      [id, trackId, provider, expiresAt, JSON.stringify(payload)],
    );
  },

  async upsertPlaybackSession(
    id: string,
    trackId: string,
    provider: string,
    expiresAt: string,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO playback_sessions (id, track_id, provider, expires_at, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         track_id = EXCLUDED.track_id,
         provider = EXCLUDED.provider,
         expires_at = EXCLUDED.expires_at,
         payload = EXCLUDED.payload`,
      [id, trackId, provider, expiresAt, JSON.stringify(payload)],
    );
  },

  async upsertEntitlement(
    id: string,
    walletAddress: string,
    trackId: string,
    source: string,
    startsAt: string,
    endsAt: string | null,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO entitlements (id, wallet_address, track_id, source, starts_at, ends_at, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         wallet_address = EXCLUDED.wallet_address,
         track_id = EXCLUDED.track_id,
         source = EXCLUDED.source,
         starts_at = EXCLUDED.starts_at,
         ends_at = EXCLUDED.ends_at,
         payload = EXCLUDED.payload`,
      [id, walletAddress, trackId, source, startsAt, endsAt, JSON.stringify(payload)],
    );
  },

  async listEntitlementsByWallet<T>(walletAddress: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM entitlements WHERE wallet_address = $1 ORDER BY id`,
      [walletAddress],
    );

    return mapPayloadRows<T>(result.rows);
  },

  async listEntitlementsByTrack<T>(trackId: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM entitlements WHERE track_id = $1 ORDER BY id`,
      [trackId],
    );

    return mapPayloadRows<T>(result.rows);
  },

  async upsertArchive(
    id: string,
    trackId: string,
    createdAt: string,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO archives (id, track_id, created_at, payload)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         track_id = EXCLUDED.track_id,
         created_at = EXCLUDED.created_at,
         payload = EXCLUDED.payload`,
      [id, trackId, createdAt, JSON.stringify(payload)],
    );
  },

  async listArchivesByTrack<T>(trackId: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM archives WHERE track_id = $1 ORDER BY created_at DESC, id`,
      [trackId],
    );

    return mapPayloadRows<T>(result.rows);
  },

  async upsertPaymentIntent(
    id: string,
    walletAddress: string,
    productType: string,
    trackId: string | null,
    artistId: string | null,
    status: string,
    expiresAt: string,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO payment_intents (id, wallet_address, product_type, track_id, artist_id, status, expires_at, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         wallet_address = EXCLUDED.wallet_address,
         product_type = EXCLUDED.product_type,
         track_id = EXCLUDED.track_id,
         artist_id = EXCLUDED.artist_id,
         status = EXCLUDED.status,
         expires_at = EXCLUDED.expires_at,
         payload = EXCLUDED.payload`,
      [id, walletAddress, productType, trackId, artistId, status, expiresAt, JSON.stringify(payload)],
    );
  },

  async listPaymentIntentsByWallet<T>(walletAddress: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM payment_intents WHERE wallet_address = $1 ORDER BY expires_at DESC, id DESC`,
      [walletAddress],
    );

    return mapPayloadRows<T>(result.rows);
  },

  async upsertPayment(
    id: string,
    intentId: string,
    walletAddress: string,
    txHash: string,
    productType: string,
    trackId: string | null,
    artistId: string | null,
    confirmedAt: string,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO payments (id, intent_id, wallet_address, tx_hash, product_type, track_id, artist_id, confirmed_at, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         intent_id = EXCLUDED.intent_id,
         wallet_address = EXCLUDED.wallet_address,
         tx_hash = EXCLUDED.tx_hash,
         product_type = EXCLUDED.product_type,
         track_id = EXCLUDED.track_id,
         artist_id = EXCLUDED.artist_id,
         confirmed_at = EXCLUDED.confirmed_at,
         payload = EXCLUDED.payload`,
      [id, intentId, walletAddress, txHash, productType, trackId, artistId, confirmedAt, JSON.stringify(payload)],
    );
  },

  async findPaymentByTxHash<T>(txHash: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM payments WHERE tx_hash = $1 LIMIT 1`,
      [txHash],
    );

    return result.rows[0]?.payload as T | null;
  },

  async listPaymentsByWallet<T>(walletAddress: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM payments WHERE wallet_address = $1 ORDER BY confirmed_at DESC, id DESC`,
      [walletAddress],
    );

    return mapPayloadRows<T>(result.rows);
  },

  async upsertSubscription(
    id: string,
    walletAddress: string,
    artistId: string,
    status: string,
    endsAt: string,
    payload: unknown,
  ) {
    await pool.query(
      `INSERT INTO subscriptions (id, wallet_address, artist_id, status, ends_at, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         wallet_address = EXCLUDED.wallet_address,
         artist_id = EXCLUDED.artist_id,
         status = EXCLUDED.status,
         ends_at = EXCLUDED.ends_at,
         payload = EXCLUDED.payload`,
      [id, walletAddress, artistId, status, endsAt, JSON.stringify(payload)],
    );
  },

  async listSubscriptionsByWallet<T>(walletAddress: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM subscriptions WHERE wallet_address = $1 ORDER BY ends_at DESC, id DESC`,
      [walletAddress],
    );

    return mapPayloadRows<T>(result.rows);
  },

  async listSubscriptionsByArtist<T>(artistId: string) {
    const result = await pool.query<PersistedRow>(
      `SELECT id, payload FROM subscriptions WHERE artist_id = $1 ORDER BY ends_at DESC, id DESC`,
      [artistId],
    );

    return mapPayloadRows<T>(result.rows);
  },
};
