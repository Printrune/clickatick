-- Private A2 snapshots only. No public catalog or paid orders.
CREATE TABLE IF NOT EXISTS organizer_event_drafts (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
 version integer NOT NULL DEFAULT 1 CHECK (version > 0),
 draft jsonb NOT NULL CHECK (jsonb_typeof(draft) = 'object'),
 source text NOT NULL CHECK (source IN ('manual','conversation')),
 created_by_clerk_user_id text NOT NULL,
 updated_by_clerk_user_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS organizer_event_drafts_brand_order_idx ON organizer_event_drafts (organizer_id,updated_at DESC,id DESC);

CREATE TABLE IF NOT EXISTS organizer_media_assets (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
 private_blob_path text NOT NULL UNIQUE,
 mime text NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
 byte_length integer NOT NULL CHECK (byte_length BETWEEN 1 AND 2097152),
 width integer NOT NULL CHECK (width BETWEEN 1 AND 4096),
 height integer NOT NULL CHECK (height BETWEEN 1 AND 4096),
 alt_text text NOT NULL DEFAULT '',
 state text NOT NULL DEFAULT 'ready' CHECK (state IN ('ready','deleted')),
 created_by_clerk_user_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT organizer_media_pixels CHECK (width * height <= 12000000)
);
CREATE INDEX IF NOT EXISTS organizer_media_assets_brand_idx ON organizer_media_assets (organizer_id,state);
