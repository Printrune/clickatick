-- Phase A1 only: organizer brands, Clerk membership, idempotent brand creation.
-- Apply to a fresh Neon database. Do not import the Lovable/Supabase schema or data.
CREATE TABLE IF NOT EXISTS organizers (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizer_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 48),
  CONSTRAINT organizer_name_length CHECK (length(name) BETWEEN 2 AND 100)
);

CREATE TABLE IF NOT EXISTS organizer_members (
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','editor','viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organizer_id, clerk_user_id),
  CONSTRAINT clerk_user_id_length CHECK (length(clerk_user_id) BETWEEN 1 AND 255)
);
CREATE INDEX IF NOT EXISTS organizer_members_user_idx ON organizer_members (clerk_user_id, status);

CREATE TABLE IF NOT EXISTS request_idempotency (
  scope text NOT NULL,
  key uuid NOT NULL,
  request_hash char(64) NOT NULL,
  response_json jsonb NOT NULL,
  status_code smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (scope, key),
  CONSTRAINT idempotency_scope_length CHECK (length(scope) BETWEEN 1 AND 300),
  CONSTRAINT idempotency_status CHECK (status_code BETWEEN 200 AND 299)
);
CREATE INDEX IF NOT EXISTS request_idempotency_expiry_idx ON request_idempotency (expires_at);

CREATE TABLE IF NOT EXISTS request_rate_limit (
  scope text NOT NULL,
  minute_bucket timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count BETWEEN 1 AND 10),
  PRIMARY KEY (scope, minute_bucket)
);
CREATE INDEX IF NOT EXISTS request_rate_limit_bucket_idx ON request_rate_limit (minute_bucket);
