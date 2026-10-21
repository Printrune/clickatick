-- Zero-charge demo code registry. One organizer-wide namespace prevents promo/referral collisions.
CREATE TABLE IF NOT EXISTS organizer_offer_codes (
 id uuid PRIMARY KEY,
 organizer_id uuid NOT NULL REFERENCES organizers(id),
 event_id uuid NULL,
 code_normalized text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('percentage','fixed','referral')),
 basis_points integer NULL,
 amount_minor integer NULL,
 minimum_original_subtotal_minor integer NOT NULL DEFAULT 0 CHECK(minimum_original_subtotal_minor BETWEEN 0 AND 100000000),
 maximum_real_redemptions integer NULL CHECK(maximum_real_redemptions > 0),
 active boolean NOT NULL DEFAULT false,
 expires_at timestamptz NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version > 0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT organizer_offer_code_format CHECK(code_normalized ~ '^[A-Z0-9-]{4,32}$'),
 CONSTRAINT organizer_offer_value CHECK(
  (kind='percentage' AND basis_points IS NOT NULL AND basis_points BETWEEN 1 AND 10000 AND amount_minor IS NULL)
  OR (kind='fixed' AND amount_minor IS NOT NULL AND amount_minor BETWEEN 1 AND 100000000 AND basis_points IS NULL)
  OR (kind='referral' AND event_id IS NOT NULL AND basis_points IS NULL AND amount_minor IS NULL AND minimum_original_subtotal_minor=0 AND maximum_real_redemptions IS NULL AND expires_at IS NULL)
 ),
 CONSTRAINT organizer_offer_event_fk FOREIGN KEY(organizer_id,event_id) REFERENCES public_events(organizer_id,id),
 UNIQUE(organizer_id,code_normalized)
);
CREATE INDEX IF NOT EXISTS organizer_offer_list_idx ON organizer_offer_codes(organizer_id,kind,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS organizer_offer_event_idx ON organizer_offer_codes(event_id,kind,active);
