-- A5 stable-ID storefront and staff link core. Apply after 001-004.
CREATE TABLE IF NOT EXISTS organizer_storefronts (
 organizer_id uuid PRIMARY KEY REFERENCES organizers(id) ON DELETE CASCADE,
 description text NOT NULL DEFAULT '' CHECK (char_length(description)<=2000),
 logo_asset_id uuid NULL,
 banner_asset_id uuid NULL,
 version integer NOT NULL DEFAULT 1 CHECK (version>0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE organizer_members ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE organizer_members ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1 CHECK (version>0);
UPDATE organizer_members SET id=gen_random_uuid() WHERE id IS NULL;
ALTER TABLE organizer_members ALTER COLUMN id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organizer_members_id_idx ON organizer_members(id);
CREATE TABLE IF NOT EXISTS organizer_invitations (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('editor','viewer')),
 channel text NOT NULL DEFAULT 'link' CHECK (channel='link'),
 token_hash char(64) UNIQUE NOT NULL,
 created_by_clerk_user_id text NOT NULL,
 status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','accepted','revoked')),
 accepted_by_clerk_user_id text NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 accepted_at timestamptz NULL,
 revoked_at timestamptz NULL,
 version integer NOT NULL DEFAULT 1 CHECK (version>0),
 idempotency_key uuid NOT NULL,
 request_hash char(64) NOT NULL,
 UNIQUE(organizer_id,created_by_clerk_user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS organizer_invites_list_idx ON organizer_invitations(organizer_id,created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS organizer_team_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
 actor_clerk_user_id text NOT NULL,
 action text NOT NULL,
 invitation_id uuid NULL,
 membership_id uuid NULL,
 request_id text NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
