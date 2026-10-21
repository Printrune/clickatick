# Anonymous publishing and demo checkout verification v1

2026-10-18. Brief v62 approved implementation, v63 records this verified release. Contracts demo-publishing-v1.md and v2.md were agreed before their implementation. Specialist handoffs and independent reviews are under backend/ and frontend/.

## Release and storage

Production dpl_AUQhyK1a76Q81fngHBH3AHAetnHr is READY and assigned to https://ticketnest-psi.vercel.app/.71-file source manifest excludes development fixtures and checks Claude schema limits. Next production build passed after the final readiness correction.

The owner created the private clickatick-demo-listings Blob store and connected Production. Metadata verified BLOB_STORE_ID and BLOB_WEBHOOK_PUBLIC_KEY on Production/Preview, without decrypting or printing secrets. DEMO_PUBLISHING_ENABLED=true is Production-only. The initial release dpl_3rJqzFjg4rjqutGpjmzzSoTv6Krn rejected the first seed before writes because readiness incorrectly required an environment OIDC token. Installed SDK source confirmed request-context authentication. Contract v2 and its test corrected readiness; SDK remains the authority on actual authentication. The same persisted seed intent succeeded on the final release.

## Automated verification

Full suite:230 passed,0 failed. Evidence: evidence/demo-full-tests-v1.txt.45 actual PostgreSQL import checks passed, and the independent reviewer ran legacy mocked publication checks. Two local disk tests initially aborted inside the sandbox; both passed outside it, then the complete suite passed outside the sandbox with test concurrency1. These were environment failures, not silently skipped tests.

Final configuration correction:42 focused demo/listing/setup checks passed; independent review reran16 demo checks. Counts overlap with the full suite. No extra paid AI request was needed for this publishing feature.

`node scripts/verify-live-demo-publishing-v1.mjs --confirm-public-demo` passed eight actual hosted checks. Stable fictional IDs are persisted before the first write. Evidence: evidence/live-demo-publishing-v1.json. Verified anonymous creation, same-content replay, changed-content conflict, separate public read, shared10 rejecting basket11, server-priced Adult/Child receipt with chargedCents0, receipt replay and independent receipt-page read. No process memory or temporary disk is used as hosted persistence.

Public listing: https://ticketnest-psi.vercel.app/listing/54ce663c-d2c8-431b-87aa-6427a0309821

API fixture receipt: https://ticketnest-psi.vercel.app/receipt/20220e0b-dfaa-44c0-aea6-4fb12d4ba0ab

## Browser evidence

On a fresh loopback origin3033, the explicitly labelled fixture loaded a fictional draft only when storage was empty. Actual Workspace Review showed Publish demo listing with no login. A simulated503 retained the draft and retry reused d0595ee6-f5e6-4f08-9792-04d093c7b078. Editing the title hid the old public link and published with0dd0dde2-7f02-48db-bdae-7a544175b956. Only the API response was simulated for this interface check. The fixture was removed and its recorded task-owned preview stopped before build. The deployment manifest rejects that fixture if present. No old local or production draft was reset.

Actual production browser checkout selected2 Adult and1 Child tickets, showed an illustrative total$50 and charged$0, then stored receipt07649d83-8988-476a-9d6f-296f7bc08b96. Its public server-rendered receipt survived reload. Downloaded JSON was read and asserted against that ID, total5000, charged0 and demo true. Desktop and390x844 mobile views were inspected; the viewport was reset afterward.

Browser receipt: https://ticketnest-psi.vercel.app/receipt/07649d83-8988-476a-9d6f-296f7bc08b96

Screenshots: evidence/demo-purchase-desktop-v1.png, evidence/demo-confirmation-desktop-v1.png, evidence/demo-confirmation-mobile-v1.png, evidence/demo-checkout-mobile-v1.png.

## Limits

This is a bounded public demo:20 immutable listing snapshots and100 confirmations. It collects no purchaser personal information, takes no payment, reserves no stock and grants no admission. Confirmations persist and download; email and payouts are not connected. Real inventory, mutable organizer ownership and real checkout need a separate production design. Physical microphone/camera quality remains unverified. The separate category-loop repair has two successful paid production Claude turns documented in ticket-category-verification-v1.md.
