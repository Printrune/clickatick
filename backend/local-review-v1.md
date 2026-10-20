# Local backend review v1

Task started from brief version 13, completed against version 15. The owner requests local operation and deferred AI. Contract/local-api-v1.md was agreed before implementation.

Implemented actual PostgreSQL persistence with PGlite under ignored .local-data. The local engine applies the existing tested event, ticket type and occurrence schema. No imported credentials or hosted database is used. A single global initialization promise shares the engine between Next route modules. The local launcher must run one server process against this directory.

Explicit local organiser login creates a random 256-bit cookie token. PostgreSQL stores its SHA-256 hash with an eight hour expiry. Logout revokes it in the database. This is a local organiser account, not email authentication or production identity verification.

Local mode requires LOCAL_MODE=true and is disabled when VERCEL is set. Local account and publication handlers require loopback Host and matching Origin. Session validation also rejects non-loopback hosts. The launcher binds 127.0.0.1. This provides local development access, not protection against other trusted programs on the same computer.

The existing listing schema, boundary validation and atomic publish_event_draft transaction remain authoritative. Listing reads use the same public projection. Local URLs are available on this computer, not published on the internet. AI remains disabled in connections() regardless of provider credentials.

Checks actually run:

- node --test tests/local-store.test.mjs: 2 tests passed. Real disk creation, publication, repeated publication, close/reopen persistence, ticket data read-back, update, unauthorized owner rejection, session persistence and revocation persistence. Executed outside the restricted filesystem sandbox, where PGlite disk access works.
- node backend/verify-import-v2.mjs: all 45 actual PostgreSQL transaction, permissions, occurrence and budget checks passed.
- node backend/verify-v2.mjs: existing hosted route rehearsal passed with every external fetch intercepted. The source adapter was updated for the new local imports.

The restricted filesystem sandbox aborted PGlite disk reopening. The successful disk test ran outside that sandbox. Production build and browser/HTTP journey verification are owned by the Product Manager and are not claimed here.

Files: lib/local-store.mjs, lib/services.js, app/api/auth/route.js, app/api/listings/route.js, app/listing/[id]/page.jsx, tests/local-store.test.mjs, next.config.mjs, .gitignore, backend/verify-v2.mjs.

No hosted services, email delivery, AI calls, payment services, costs or admissions were activated. No owner decisions are needed for this local backend.
