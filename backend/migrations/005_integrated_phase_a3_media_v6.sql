-- A3 v6 direct-media schema. Apply after 004 and before A5 migration 006.
-- Read paths and old ready images remain intact. No upload is activated by migration.
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_assets_mime_check;
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_assets_mime_check CHECK (mime IN ('image/jpeg','image/png','image/webp','video/mp4'));
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_assets_kind_check;
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_assets_kind_check CHECK (kind IN ('business','event-location','cover','event-video','poster'));
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_assets_state_check;
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_assets_state_check CHECK (state IN ('pending','uploading','verifying','reconciling','ready','failed','deleting','deleted'));
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_ready_shape;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video'));
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS source_name text NOT NULL DEFAULT '' CHECK (length(source_name)<=120);
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS source_mime text;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS source_bytes integer;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS source_blob_path text UNIQUE;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS source_stored_bytes integer;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS source_cleanup_pending boolean NOT NULL DEFAULT false;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS failure_code text;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS failure_message text;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS processing_generation integer NOT NULL DEFAULT 0;
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_source_bound CHECK (source_bytes IS NULL OR source_bytes BETWEEN 1 AND 100000000);
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_source_stored_bound CHECK (source_stored_bytes IS NULL OR source_stored_bytes BETWEEN 0 AND 100000000);
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_output_bound CHECK (byte_length IS NULL OR byte_length BETWEEN 1 AND 100000000);
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_v6_ready_shape CHECK (
 state NOT IN ('ready','deleting') OR
 (byte_length IS NOT NULL AND (media_type='video' OR
  (width BETWEEN 1 AND 4096 AND height BETWEEN 1 AND 4096 AND width*height<=12000000 AND byte_length<=5000000)))
);
-- Legacy ready images already have a retained normalized path and size.
UPDATE organizer_media_assets SET source_stored_bytes=0,source_cleanup_pending=false WHERE state='ready' AND media_type='image' AND source_stored_bytes IS NULL;
CREATE INDEX IF NOT EXISTS organizer_media_v6_list_idx ON organizer_media_assets(organizer_id,created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS blob_store_usage (
 store_id text PRIMARY KEY,
 observed_bytes bigint NOT NULL DEFAULT 0 CHECK (observed_bytes>=0),
 reserved_bytes bigint NOT NULL DEFAULT 0 CHECK (reserved_bytes>=0),
 untracked_bytes bigint NOT NULL DEFAULT 0 CHECK (untracked_bytes>=0),
 last_full_scan_at timestamptz,
 reconciliation_status text NOT NULL DEFAULT 'unknown' CHECK (reconciliation_status IN ('unknown','ready')),
 generation bigint NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS blob_store_inventory (
 store_id text NOT NULL REFERENCES blob_store_usage(store_id) ON DELETE CASCADE,
 pathname text NOT NULL,
 byte_length bigint NOT NULL CHECK (byte_length>=0),
 scan_generation bigint NOT NULL,
 PRIMARY KEY(store_id,pathname)
);
CREATE TABLE IF NOT EXISTS media_upload_reservations (
 asset_id uuid PRIMARY KEY REFERENCES organizer_media_assets(id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES blob_store_usage(store_id),
 declared_source_bytes integer NOT NULL CHECK(declared_source_bytes BETWEEN 1 AND 100000000),
 output_allowance_bytes integer NOT NULL CHECK(output_allowance_bytes IN (0,5000000)),
 reserved_bytes bigint NOT NULL CHECK(reserved_bytes>=0),
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- The old delete function only removes one path. V6 multi-path delete must use
-- a separate guarded service; old delete stays gated off during transition.
