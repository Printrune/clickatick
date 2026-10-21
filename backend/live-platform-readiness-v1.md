# Backend review: live platform with simulated payment

Brief read: `brief/project.json` version 107. The owner's new instruction is to make the platform live while payment alone remains simulated. This review covers backend behavior; it does not claim connected release verification.

## Existing working foundation

- Clerk and Neon are connected in Preview. The owner reached a new brand dashboard after signing in and creating a brand. This is owner-reported browser evidence, not an independent database read.
- Migrations 001–008 were applied in Preview, as recorded in `handoffs/021-pm-eight-migration-preview-v1.md`. Production schema state is not independently verified here.
- The new catalog API reads published Neon events; authenticated brand creation, event drafts, owner publishing, public detail, quote, demo checkout, and receipts have server implementations and local tests. A code path or local test is not a hosted end-to-end result.
- Demo checkout uses a separate `DEMO_CHECKOUT_ENABLED` gate and does not charge, reserve seats, issue admission tickets, or send confirmation email. It can remain explicitly simulated while real listings and organizer management are enabled.

## Release gates and evidence required

1. `CREATOR_NEON_CUTOVER_ENABLED` must switch `/` and `/creator` to the owner-linked Neon path. Verify a signed-in creator transfers a draft to a brand, reviews it, and publishes. Legacy Blob listings should remain accessible by direct URL only.
2. `NEXT_PUBLIC_NEON_DEMO_CATALOG_ENABLED` currently labels a new catalog as demo. Avoid enabling a second competing catalog when the cutover catalog is active. The public `/api/v1/events` path already reads Neon without this flag.
3. A4 publication checks owner membership and the draft version, then requires `BLOB_READ_WRITE_TOKEN`; referenced assets must be in `ready` state (`lib/integrated-phase-a4-runtime.mjs`, `lib/integrated-phase-a4-write.mjs`). A real image upload and publish must be tested on the connected private store.
4. Media v6 upload requires `MEDIA_V6_CONNECTED_VERIFIED`, `MEDIA_ALL_WRITERS_COORDINATED`, `MEDIA_BLOB_STORE_ID`, `BLOB_READ_WRITE_TOKEN`, and the image upload gate. Do not turn these on because a Blob store merely exists. Verify store ownership, shared quota, upload, fetch, delete, and failure recovery. Video upload/playback have separate gates.
5. `DEMO_CHECKOUT_ENABLED` can turn on only after a published event supports quote, selectable general admission/seat options, confirmation, and repeat/abuse behavior in Preview. Keep every checkout and receipt explicitly labeled simulated. No payment or real admission is connected.
6. `STOREFRONT_ENABLED`, `STAFF_INVITES_ENABLED`, `SEAT_AUTHORING_ENABLED`, `PUBLISHED_REVISIONS_ENABLED`, `PROMOTIONS_DEMO_ENABLED`, and `REFERRALS_DEMO_ENABLED` are separate. Migration 006–008 presence is necessary but not sufficient. Test access control and flows individually. Email staff invitations still return `EMAIL_NOT_CONNECTED`, so only private link invitations can be described as functional.
7. Production promotion requires a verified Production Clerk/Neon/Blob configuration and schema. A successful Preview build does not prove Production shares these resources or that a fresh Production publish works.
8. `lib/integrated-phase-a4.mjs` currently sends `demo:true` in both the public event summary and detail. That marks a real published listing as demo at the API boundary. Frontend and Backend should agree a prospective response-contract revision that removes this event-level marker while retaining `paymentConnected:false`, `seatSelectionReserves:false`, and explicit simulated checkout fields. No response shape was changed during this audit.
9. Legacy A3 private image preview and references routes still call `phaseA3`, which is instantiated with `enabled:false`. The v6 upload and public media routes are separate. Verify the organizer media UI does not depend on those permanently disabled legacy reads before calling image management live.

## Backend recommendation

Treat event creation, listing, organizer management, and public discovery as the live product. Keep `demo` terminology on quote, checkout, receipt, seat selection, and referral reward projections because these functions do not perform real transactions. Keep safety gates default-off until each connected Preview journey passes. Do not change server contract or enable all flags together. Existing local checks passed in the prior handoff; this audit changed no runtime code.

## Gaps and decisions

- The requested state is not achieved yet. No connected signed-in publish and public Neon listing has been verified.
- Production readiness and media operation are unverified. The required image may prevent publication until private storage is operational.
- Digital sale confirmations, payment-method coverage, payouts, and email invites are not connected. A “live except payment” label should not imply these functions work.
- No backend interface change was made; frontend and backend must agree a new contract before a change to request/response shapes.
