-- Private media lifecycle. Apply after migrations 001 and 002.
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_assets_state_check;
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_assets_byte_length_check;
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_assets_width_check;
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_assets_height_check;
ALTER TABLE organizer_media_assets DROP CONSTRAINT IF EXISTS organizer_media_pixels;
ALTER TABLE organizer_media_assets ALTER COLUMN byte_length DROP NOT NULL;
ALTER TABLE organizer_media_assets ALTER COLUMN width DROP NOT NULL;
ALTER TABLE organizer_media_assets ALTER COLUMN height DROP NOT NULL;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'cover' CHECK (kind IN ('business','event-location','cover'));
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS upload_id uuid;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS upload_subject text;
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS request_hash char(64);
ALTER TABLE organizer_media_assets ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_assets_state_check CHECK (state IN ('pending','reconciling','ready','failed','deleting','deleted'));
ALTER TABLE organizer_media_assets ADD CONSTRAINT organizer_media_ready_shape CHECK (
 state NOT IN ('ready','deleting') OR
 (byte_length BETWEEN 1 AND 2097152 AND width BETWEEN 1 AND 4096 AND height BETWEEN 1 AND 4096 AND width * height <= 12000000)
);
CREATE UNIQUE INDEX IF NOT EXISTS organizer_media_upload_key_idx ON organizer_media_assets(organizer_id,upload_subject,upload_id) WHERE upload_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organizer_media_brand_id_idx ON organizer_media_assets(organizer_id,id);
CREATE INDEX IF NOT EXISTS organizer_media_gallery_idx ON organizer_media_assets(organizer_id,created_at DESC,id DESC) WHERE state IN ('ready','deleting');
CREATE UNIQUE INDEX IF NOT EXISTS organizer_event_brand_id_idx ON organizer_event_drafts(organizer_id,id);

CREATE TABLE IF NOT EXISTS organizer_event_asset_refs (
 organizer_id uuid NOT NULL,
 event_id uuid NOT NULL,
 slot text NOT NULL CHECK (slot IN ('business','event-location','cover')),
 asset_id uuid NOT NULL,
 PRIMARY KEY (organizer_id,event_id,slot),
 FOREIGN KEY (organizer_id,event_id) REFERENCES organizer_event_drafts(organizer_id,id) ON DELETE CASCADE,
 FOREIGN KEY (organizer_id,asset_id) REFERENCES organizer_media_assets(organizer_id,id)
);
CREATE INDEX IF NOT EXISTS organizer_asset_ref_lookup_idx ON organizer_event_asset_refs(organizer_id,asset_id,event_id,slot);

-- A2 never enabled uploads, but backfill exact references for any private assets
-- created by a local fixture or prior manual migration. Fail on unknown IDs.
INSERT INTO organizer_event_asset_refs(organizer_id,event_id,slot,asset_id)
SELECT e.organizer_id,e.id,x.slot,x.asset_id
FROM organizer_event_drafts e
CROSS JOIN LATERAL (VALUES
 ('business',(e.draft #>> '{businessLocation,photoAssetId}')::uuid),
 ('event-location',(e.draft #>> '{eventLocation,photoAssetId}')::uuid),
 ('cover',(e.draft ->> 'coverAssetId')::uuid)
) AS x(slot,asset_id)
WHERE x.asset_id IS NOT NULL
ON CONFLICT (organizer_id,event_id,slot) DO NOTHING;

-- A2 draft writes and media references now share one database transaction.
CREATE OR REPLACE FUNCTION sync_organizer_event_asset_refs() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE item record; asset_state text;
BEGIN
 DELETE FROM organizer_event_asset_refs WHERE organizer_id=NEW.organizer_id AND event_id=NEW.id;
 FOR item IN
  SELECT x.slot,x.asset_id FROM (VALUES
   ('business',(NEW.draft #>> '{businessLocation,photoAssetId}')::uuid),
   ('event-location',(NEW.draft #>> '{eventLocation,photoAssetId}')::uuid),
   ('cover',(NEW.draft ->> 'coverAssetId')::uuid)
  ) AS x(slot,asset_id) WHERE x.asset_id IS NOT NULL ORDER BY x.asset_id,x.slot
 LOOP
  SELECT state INTO asset_state FROM organizer_media_assets
   WHERE organizer_id=NEW.organizer_id AND id=item.asset_id FOR UPDATE;
  IF asset_state IS DISTINCT FROM 'ready' THEN
   RAISE EXCEPTION 'Private image is unavailable for this brand' USING ERRCODE='23503';
  END IF;
  INSERT INTO organizer_event_asset_refs(organizer_id,event_id,slot,asset_id)
   VALUES(NEW.organizer_id,NEW.id,item.slot,item.asset_id);
 END LOOP;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS organizer_event_asset_refs_sync ON organizer_event_drafts;
CREATE TRIGGER organizer_event_asset_refs_sync
AFTER INSERT OR UPDATE OF draft ON organizer_event_drafts
FOR EACH ROW EXECUTE FUNCTION sync_organizer_event_asset_refs();

-- Lock the asset, then inspect references, so concurrent attachment wins or
-- receives a non-ready state. Call only after service-side membership checks.
CREATE OR REPLACE FUNCTION begin_organizer_asset_delete(p_org uuid,p_id uuid,p_version integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a organizer_media_assets%ROWTYPE; refs integer;
BEGIN
 SELECT * INTO a FROM organizer_media_assets
  WHERE organizer_id=p_org AND id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('kind','missing'); END IF;
 IF a.state='deleted' THEN RETURN jsonb_build_object('kind','deleted'); END IF;
 IF a.version<>p_version THEN RETURN jsonb_build_object('kind','version','version',a.version); END IF;
 SELECT count(*)::integer INTO refs FROM organizer_event_asset_refs
  WHERE organizer_id=p_org AND asset_id=p_id;
 IF refs>0 THEN RETURN jsonb_build_object('kind','referenced','count',refs); END IF;
 IF a.state='deleting' THEN
  RETURN jsonb_build_object('kind','deleting','path',a.private_blob_path,'version',a.version);
 END IF;
 IF a.state<>'ready' THEN RETURN jsonb_build_object('kind','version','version',a.version); END IF;
 UPDATE organizer_media_assets SET state='deleting',version=version+1
  WHERE organizer_id=p_org AND id=p_id RETURNING version INTO a.version;
 RETURN jsonb_build_object('kind','deleting','path',a.private_blob_path,'version',a.version);
END $$;
