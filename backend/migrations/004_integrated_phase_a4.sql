-- Public immutable demo event snapshots. Apply after 001–003.
CREATE TABLE IF NOT EXISTS public_events (
 id uuid PRIMARY KEY, organizer_id uuid NOT NULL REFERENCES organizers(id),
 source_draft_id uuid NOT NULL UNIQUE REFERENCES organizer_event_drafts(id),
 source_version integer NOT NULL CHECK (source_version > 0),
 version integer NOT NULL DEFAULT 1 CHECK (version > 0),
 status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','cancelled')),
 snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot)='object'),
 published_at timestamptz NOT NULL DEFAULT now(), cancelled_at timestamptz,
 cancel_reason text NOT NULL DEFAULT '' CHECK (length(cancel_reason)<=500),
 UNIQUE (organizer_id,id)
);
CREATE INDEX IF NOT EXISTS public_events_catalog_idx ON public_events(status,published_at DESC,id DESC);
CREATE OR REPLACE FUNCTION reject_published_draft_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public_events WHERE source_draft_id=OLD.id) THEN
  RAISE EXCEPTION 'Published event details cannot be changed' USING ERRCODE='23514', CONSTRAINT='published_draft_locked';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS published_draft_update_lock ON organizer_event_drafts;
CREATE TRIGGER published_draft_update_lock BEFORE UPDATE OF draft ON organizer_event_drafts
FOR EACH ROW EXECUTE FUNCTION reject_published_draft_update();
CREATE TABLE IF NOT EXISTS public_occurrences (
 id uuid PRIMARY KEY, organizer_id uuid NOT NULL, event_id uuid NOT NULL,
 start_local text NOT NULL, starts_at_utc timestamptz NOT NULL,
 ends_at_utc timestamptz NOT NULL, time_zone text NOT NULL,
 duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 1440),
 FOREIGN KEY (organizer_id,event_id) REFERENCES public_events(organizer_id,id),
 UNIQUE(event_id,start_local), UNIQUE(event_id,id)
);
CREATE INDEX IF NOT EXISTS public_occurrences_event_idx ON public_occurrences(event_id,starts_at_utc,id);
CREATE TABLE IF NOT EXISTS public_tiers (
 id uuid NOT NULL, organizer_id uuid NOT NULL, event_id uuid NOT NULL,
 position integer NOT NULL, name text NOT NULL, description text NOT NULL,
 price_minor integer NOT NULL CHECK (price_minor BETWEEN 0 AND 10000000),
 allocation integer, seat_policy text NOT NULL CHECK (seat_policy IN ('none','optional','required')),
 PRIMARY KEY(event_id,id), FOREIGN KEY(organizer_id,event_id) REFERENCES public_events(organizer_id,id),
 UNIQUE(event_id,position)
);
CREATE TABLE IF NOT EXISTS public_sections (
 id uuid NOT NULL, organizer_id uuid NOT NULL, event_id uuid NOT NULL,
 position integer NOT NULL, name text NOT NULL, rows integer NOT NULL,
 seats_per_row integer NOT NULL, seat_tier_id uuid,
 PRIMARY KEY(event_id,id), FOREIGN KEY(organizer_id,event_id) REFERENCES public_events(organizer_id,id),
 FOREIGN KEY(event_id,seat_tier_id) REFERENCES public_tiers(event_id,id), UNIQUE(event_id,position)
);
CREATE TABLE IF NOT EXISTS public_seats (
 id uuid PRIMARY KEY, organizer_id uuid NOT NULL, event_id uuid NOT NULL,
 section_id uuid NOT NULL, row_number integer NOT NULL, seat_number integer NOT NULL,
 accessible boolean NOT NULL DEFAULT false,
 FOREIGN KEY(event_id,section_id) REFERENCES public_sections(event_id,id),
 UNIQUE(event_id,section_id,row_number,seat_number)
);
CREATE INDEX IF NOT EXISTS public_seats_section_idx ON public_seats(event_id,section_id,row_number,seat_number,id);
CREATE TABLE IF NOT EXISTS public_inventory_pools (
 id uuid PRIMARY KEY, organizer_id uuid NOT NULL, event_id uuid NOT NULL,
 occurrence_id uuid, tier_id uuid, configured_capacity integer NOT NULL CHECK(configured_capacity>0),
 FOREIGN KEY(organizer_id,event_id) REFERENCES public_events(organizer_id,id),
 FOREIGN KEY(event_id,occurrence_id) REFERENCES public_occurrences(event_id,id),
 FOREIGN KEY(event_id,tier_id) REFERENCES public_tiers(event_id,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS public_pool_scope_idx ON public_inventory_pools(event_id,coalesce(occurrence_id,'00000000-0000-0000-0000-000000000000'::uuid),coalesce(tier_id,'00000000-0000-0000-0000-000000000000'::uuid));
CREATE TABLE IF NOT EXISTS public_media_refs (
 organizer_id uuid NOT NULL, event_id uuid NOT NULL, slot text NOT NULL CHECK(slot IN ('business','event-location','cover')),
 asset_id uuid NOT NULL, PRIMARY KEY(event_id,slot),
 FOREIGN KEY(organizer_id,event_id) REFERENCES public_events(organizer_id,id),
 FOREIGN KEY(organizer_id,asset_id) REFERENCES organizer_media_assets(organizer_id,id)
);
CREATE INDEX IF NOT EXISTS public_media_asset_idx ON public_media_refs(organizer_id,asset_id);
-- A3 delete remains blocked by any published or cancelled event reference.
CREATE OR REPLACE FUNCTION begin_organizer_asset_delete(p_org uuid,p_id uuid,p_version integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a organizer_media_assets%ROWTYPE; refs integer;
BEGIN
 SELECT * INTO a FROM organizer_media_assets WHERE organizer_id=p_org AND id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('kind','missing'); END IF;
 IF a.state='deleted' THEN RETURN jsonb_build_object('kind','deleted'); END IF;
 IF a.version<>p_version THEN RETURN jsonb_build_object('kind','version','version',a.version); END IF;
 SELECT (SELECT count(*) FROM organizer_event_asset_refs WHERE organizer_id=p_org AND asset_id=p_id)
      + (SELECT count(*) FROM public_media_refs WHERE organizer_id=p_org AND asset_id=p_id) INTO refs;
 IF refs>0 THEN RETURN jsonb_build_object('kind','referenced','count',refs); END IF;
 IF a.state='deleting' THEN RETURN jsonb_build_object('kind','deleting','path',a.private_blob_path,'version',a.version); END IF;
 IF a.state<>'ready' THEN RETURN jsonb_build_object('kind','version','version',a.version); END IF;
 UPDATE organizer_media_assets SET state='deleting',version=version+1 WHERE organizer_id=p_org AND id=p_id RETURNING version INTO a.version;
 RETURN jsonb_build_object('kind','deleting','path',a.private_blob_path,'version',a.version);
END $$;
-- Schema is prepared, but anonymous creation stays disabled pending approved quotas/retention.
CREATE TABLE IF NOT EXISTS demo_quotes (
 id uuid PRIMARY KEY, event_id uuid NOT NULL REFERENCES public_events(id), occurrence_id uuid NOT NULL,
 event_version integer NOT NULL, selection jsonb NOT NULL, response_json jsonb NOT NULL,
 request_hash char(64) NOT NULL, idempotency_key uuid NOT NULL,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(event_id,idempotency_key),
 FOREIGN KEY(event_id,occurrence_id) REFERENCES public_occurrences(event_id,id)
);
CREATE TABLE IF NOT EXISTS demo_receipts (
 id uuid PRIMARY KEY, event_id uuid NOT NULL REFERENCES public_events(id), quote_id uuid NOT NULL UNIQUE REFERENCES demo_quotes(id),
 response_json jsonb NOT NULL, request_hash char(64) NOT NULL,
 idempotency_key uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(event_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS demo_rate_limits (
 scope text NOT NULL, bucket_start timestamptz NOT NULL,
 request_count integer NOT NULL CHECK(request_count>0),
 PRIMARY KEY(scope,bucket_start)
);
CREATE INDEX IF NOT EXISTS demo_rate_limits_bucket_idx ON demo_rate_limits(bucket_start);
