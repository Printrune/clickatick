-- First-party activity planner. No device fingerprint or buyer/payment data.
CREATE TABLE IF NOT EXISTS saved_events (
 owner_kind text NOT NULL CHECK (owner_kind IN ('anonymous','clerk')),
 owner_key text NOT NULL CHECK (length(owner_key) BETWEEN 1 AND 255),
 source text NOT NULL CHECK (source IN ('ticketmaster','clickatick')),
 event_id text NOT NULL CHECK (length(event_id) BETWEEN 1 AND 64),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 300),
 event_url text NOT NULL CHECK (length(event_url) BETWEEN 1 AND 180),
 event_date text,
 venue text,
 city text,
 image_url text,
 added_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (owner_kind,owner_key,source,event_id)
);
CREATE INDEX IF NOT EXISTS saved_events_owner_order_idx ON saved_events(owner_kind,owner_key,added_at DESC);
CREATE TABLE IF NOT EXISTS planner_rate_limits (
 owner_kind text NOT NULL CHECK (owner_kind IN ('anonymous','clerk')),
 owner_key text NOT NULL,
 minute_bucket timestamptz NOT NULL,
 request_count integer NOT NULL CHECK (request_count BETWEEN 1 AND 30),
 PRIMARY KEY (owner_kind,owner_key,minute_bucket)
);
CREATE INDEX IF NOT EXISTS planner_rate_limits_bucket_idx ON planner_rate_limits(minute_bucket);
