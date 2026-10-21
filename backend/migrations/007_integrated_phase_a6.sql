-- A6 immutable approved event versions and private revisions. Apply after 001–006.
-- A4 tables remain a v1 compatibility projection until every reader is migrated.
ALTER TABLE public_events ADD COLUMN IF NOT EXISTS active_version integer NOT NULL DEFAULT 1 CHECK(active_version>0);
CREATE TABLE IF NOT EXISTS public_event_versions (
 event_id uuid NOT NULL, version integer NOT NULL CHECK(version>0), organizer_id uuid NOT NULL,
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'),
 source_revision_id uuid NULL, created_at timestamptz NOT NULL DEFAULT now(),
 approved_at timestamptz NOT NULL, approved_by_clerk_user_id text NULL,
 PRIMARY KEY(event_id,version), FOREIGN KEY(organizer_id,event_id) REFERENCES public_events(organizer_id,id),
 UNIQUE(event_id,source_revision_id)
);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public_events WHERE jsonb_typeof(snapshot)<>'object') THEN
  RAISE EXCEPTION 'A6 cannot backfill malformed published snapshots';
 END IF;
END $$;
INSERT INTO public_event_versions(event_id,version,organizer_id,snapshot,approved_at)
 SELECT id,1,organizer_id,snapshot,published_at FROM public_events ON CONFLICT(event_id,version) DO NOTHING;
ALTER TABLE public_events ADD CONSTRAINT public_events_active_version_fk FOREIGN KEY(id,active_version) REFERENCES public_event_versions(event_id,version) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS public_event_revisions (
 id uuid PRIMARY KEY, event_id uuid NOT NULL, organizer_id uuid NOT NULL,
 base_public_version integer NOT NULL CHECK(base_public_version>0), revision_version integer NOT NULL DEFAULT 1 CHECK(revision_version>0),
 status text NOT NULL CHECK(status IN ('draft','returned','pending_review','approved','withdrawn')),
 draft jsonb NOT NULL CHECK(jsonb_typeof(draft)='object'),
 created_by_clerk_user_id text NOT NULL, updated_by_clerk_user_id text NOT NULL,
 submitted_at timestamptz NULL, reviewed_at timestamptz NULL, reviewed_by_clerk_user_id text NULL,
 return_note text NOT NULL DEFAULT '' CHECK(char_length(return_note)<=500),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organizer_id,event_id) REFERENCES public_events(organizer_id,id),
 FOREIGN KEY(event_id,base_public_version) REFERENCES public_event_versions(event_id,version)
);
CREATE UNIQUE INDEX IF NOT EXISTS public_event_one_open_revision_idx ON public_event_revisions(event_id) WHERE status IN ('draft','returned','pending_review');
CREATE INDEX IF NOT EXISTS public_event_revisions_event_idx ON public_event_revisions(organizer_id,event_id,created_at DESC);
ALTER TABLE public_event_versions ADD CONSTRAINT public_event_versions_source_revision_fk FOREIGN KEY(source_revision_id) REFERENCES public_event_revisions(id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE IF NOT EXISTS public_event_revision_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organizer_id uuid NOT NULL, event_id uuid NOT NULL,
 revision_id uuid NULL, actor_clerk_user_id text NOT NULL, action text NOT NULL,
 revision_version integer NULL, public_version integer NULL, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organizer_id,event_id) REFERENCES public_events(organizer_id,id)
);

CREATE TABLE IF NOT EXISTS public_version_occurrences (
 event_id uuid NOT NULL, event_version integer NOT NULL, id uuid NOT NULL,
 start_local text NOT NULL, starts_at_utc timestamptz NOT NULL, ends_at_utc timestamptz NOT NULL,
 time_zone text NOT NULL, duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 5 AND 1440),
 PRIMARY KEY(event_id,event_version,id), FOREIGN KEY(event_id,event_version) REFERENCES public_event_versions(event_id,version)
);
CREATE INDEX IF NOT EXISTS public_version_occurrences_time_idx ON public_version_occurrences(event_id,event_version,starts_at_utc,id);
CREATE TABLE IF NOT EXISTS public_version_tiers (
 event_id uuid NOT NULL, event_version integer NOT NULL, id uuid NOT NULL,
 position integer NOT NULL, name text NOT NULL, description text NOT NULL, price_minor integer NOT NULL,
 allocation integer NULL, seat_policy text NOT NULL CHECK(seat_policy IN ('none','optional','required')),
 PRIMARY KEY(event_id,event_version,id), UNIQUE(event_id,event_version,position),
 FOREIGN KEY(event_id,event_version) REFERENCES public_event_versions(event_id,version)
);
CREATE TABLE IF NOT EXISTS public_version_sections (
 event_id uuid NOT NULL, event_version integer NOT NULL, id uuid NOT NULL,
 position integer NOT NULL, name text NOT NULL, rows integer NOT NULL, seats_per_row integer NOT NULL,
 seat_tier_id uuid NULL,
 PRIMARY KEY(event_id,event_version,id), UNIQUE(event_id,event_version,position),
 FOREIGN KEY(event_id,event_version) REFERENCES public_event_versions(event_id,version),
 FOREIGN KEY(event_id,event_version,seat_tier_id) REFERENCES public_version_tiers(event_id,event_version,id)
);
CREATE TABLE IF NOT EXISTS public_version_seats (
 event_id uuid NOT NULL, event_version integer NOT NULL, id uuid NOT NULL,
 section_id uuid NOT NULL, row_number integer NOT NULL, seat_number integer NOT NULL,
 accessible boolean NOT NULL DEFAULT false, seat_tier_id uuid NULL, tier_override boolean NOT NULL DEFAULT false,
 PRIMARY KEY(event_id,event_version,id), UNIQUE(event_id,event_version,section_id,row_number,seat_number),
 FOREIGN KEY(event_id,event_version,section_id) REFERENCES public_version_sections(event_id,event_version,id),
 FOREIGN KEY(event_id,event_version,seat_tier_id) REFERENCES public_version_tiers(event_id,event_version,id)
);
CREATE INDEX IF NOT EXISTS public_version_seats_section_idx ON public_version_seats(event_id,event_version,section_id,row_number,seat_number,id);
CREATE TABLE IF NOT EXISTS public_version_inventory_pools (
 event_id uuid NOT NULL, event_version integer NOT NULL, id uuid NOT NULL,
 occurrence_id uuid NULL, tier_id uuid NULL, configured_capacity integer NOT NULL CHECK(configured_capacity>0),
 PRIMARY KEY(event_id,event_version,id), FOREIGN KEY(event_id,event_version) REFERENCES public_event_versions(event_id,version),
 FOREIGN KEY(event_id,event_version,occurrence_id) REFERENCES public_version_occurrences(event_id,event_version,id),
 FOREIGN KEY(event_id,event_version,tier_id) REFERENCES public_version_tiers(event_id,event_version,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS public_version_pool_scope_idx ON public_version_inventory_pools(event_id,event_version,coalesce(occurrence_id,'00000000-0000-0000-0000-000000000000'::uuid),coalesce(tier_id,'00000000-0000-0000-0000-000000000000'::uuid));
CREATE TABLE IF NOT EXISTS public_version_media_refs (
 event_id uuid NOT NULL, event_version integer NOT NULL, organizer_id uuid NOT NULL,
 slot text NOT NULL CHECK(slot IN ('business','event-location','cover')), asset_id uuid NOT NULL,
 PRIMARY KEY(event_id,event_version,slot), FOREIGN KEY(event_id,event_version) REFERENCES public_event_versions(event_id,version),
 FOREIGN KEY(organizer_id,asset_id) REFERENCES organizer_media_assets(organizer_id,id)
);
CREATE INDEX IF NOT EXISTS public_version_media_asset_idx ON public_version_media_refs(organizer_id,asset_id);

INSERT INTO public_version_occurrences SELECT event_id,1,id,start_local,starts_at_utc,ends_at_utc,time_zone,duration_minutes FROM public_occurrences ON CONFLICT DO NOTHING;
INSERT INTO public_version_tiers SELECT event_id,1,id,position,name,description,price_minor,allocation,seat_policy FROM public_tiers ON CONFLICT DO NOTHING;
INSERT INTO public_version_sections SELECT event_id,1,id,position,name,rows,seats_per_row,seat_tier_id FROM public_sections ON CONFLICT DO NOTHING;
INSERT INTO public_version_seats(event_id,event_version,id,section_id,row_number,seat_number,accessible,seat_tier_id,tier_override) SELECT event_id,1,id,section_id,row_number,seat_number,accessible,NULL::uuid,false FROM public_seats ON CONFLICT DO NOTHING;
INSERT INTO public_version_inventory_pools SELECT event_id,1,id,occurrence_id,tier_id,configured_capacity FROM public_inventory_pools ON CONFLICT DO NOTHING;
INSERT INTO public_version_media_refs SELECT event_id,1,organizer_id,slot,asset_id FROM public_media_refs ON CONFLICT DO NOTHING;
UPDATE demo_quotes SET event_version=1 WHERE event_version<>1;
ALTER TABLE demo_quotes DROP CONSTRAINT IF EXISTS demo_quotes_event_id_occurrence_id_fkey;
ALTER TABLE demo_quotes ADD CONSTRAINT demo_quotes_version_occurrence_fk FOREIGN KEY(event_id,event_version,occurrence_id) REFERENCES public_version_occurrences(event_id,event_version,id);
ALTER TABLE demo_receipts ADD COLUMN IF NOT EXISTS event_version integer NULL;
ALTER TABLE demo_receipts ADD COLUMN IF NOT EXISTS event_snapshot jsonb NULL CHECK(event_snapshot IS NULL OR jsonb_typeof(event_snapshot)='object');

-- Historical approved assets remain protected even when the active listing changes.
CREATE OR REPLACE FUNCTION begin_organizer_asset_delete(p_org uuid,p_id uuid,p_version integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a organizer_media_assets%ROWTYPE; refs integer;
BEGIN
 SELECT * INTO a FROM organizer_media_assets WHERE organizer_id=p_org AND id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('kind','missing'); END IF;
 IF a.state='deleted' THEN RETURN jsonb_build_object('kind','deleted'); END IF;
 IF a.version<>p_version THEN RETURN jsonb_build_object('kind','version','version',a.version); END IF;
 SELECT (SELECT count(*) FROM organizer_event_asset_refs WHERE organizer_id=p_org AND asset_id=p_id)
      + (SELECT count(*) FROM public_version_media_refs WHERE organizer_id=p_org AND asset_id=p_id)
      + (SELECT count(*) FROM public_event_revisions r WHERE r.organizer_id=p_org AND r.status IN ('draft','returned','pending_review') AND (r.draft->>'coverAssetId'=p_id::text OR r.draft#>>'{businessLocation,photoAssetId}'=p_id::text OR r.draft#>>'{eventLocation,photoAssetId}'=p_id::text)) INTO refs;
 IF refs>0 THEN RETURN jsonb_build_object('kind','referenced','count',refs); END IF;
 IF a.state='deleting' THEN RETURN jsonb_build_object('kind','deleting','path',a.private_blob_path,'version',a.version); END IF;
 IF a.state<>'ready' THEN RETURN jsonb_build_object('kind','version','version',a.version); END IF;
 UPDATE organizer_media_assets SET state='deleting',version=version+1 WHERE organizer_id=p_org AND id=p_id RETURNING version INTO a.version;
 RETURN jsonb_build_object('kind','deleting','path',a.private_blob_path,'version',a.version);
END $$;
