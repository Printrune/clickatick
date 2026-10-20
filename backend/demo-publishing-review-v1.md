# Anonymous demo publishing review v1

Shared brief: `brief/project.json` v62. Contract: `contract/demo-publishing-v1.md`, agreed by PM/Backend/Frontend before implementation. Reviewed 2026-10-18. This review is read-only for implementation files.

## Result

No remaining blocking source finding within the approved bounded demo scope. Independent final test run:45 passed,0 failed. The existing authenticated publication rehearsal also passed. Real private Blob persistence, browser behavior and release readiness remain PM verification work; this review made no live storage or AI request.

## Contract and implementation

The anonymous APIs are separate from legacy authenticated/local publication. The old publishing capability and session requirements remain. Only the optional demoPublishing capability is added. Public listing/receipt pages read the new server adapter; the listing page retains legacy fallback. SDK/storage failures are explicit load failures, without fabricated listings or receipts.

Private records use fixed namespaced paths and normalized validated UUIDs. The SDK wrapper uses private access, no random suffix, no overwrite, JSON content type and abort deadlines. The actual installed2.8.2 declarations and current [Blob SDK documentation](https://vercel.com/docs/vercel-blob/using-blob-sdk) were inspected. Private URLs and credentials do not enter public responses. A failed or uncertain put reads back the fixed path and verifies canonical content before reporting a replay. Same ID/different content returns409. No update/delete capability or in-memory persistence fallback exists.

Create-only fixed quota slots enforce a global maximum of20 listing records and100 receipts across concurrent service instances. Retry finds its own reservation, including after all slots fill. Crashes can conservatively consume capacity; this is documented. The process-local30POST/minute guard is supplementary. It is not a distributed rate limiter. These caps bound writes; they do not guarantee unlimited public reads or unlimited free hosting usage.

Bodies are streamed and cancelled at2MiB for listing publication and16KiB for checkout, including requests without Content-Length. Origin checks precede mutation. Core completeness, schedule/timezone/DST validation and organiser disclaimer review apply before writes. Extended setup, venue photos and exact pins survive validation. Legacy extended-setup publication restrictions remain unchanged.

## Checkout and public projection

Checkout accepts only the stated id, occurrence, items and demo acknowledgement. Item rows accept only category ID and integer quantity. The service reads the immutable listing, checks its actual occurrences/categories and computes names, USD prices, line totals and total itself. Shared10 applies once across Adult/Child rows; allocated limits apply to each category. Maximums are10 rows and20 tickets. Client prices, payment credentials and purchaser personal fields are rejected. No listing capacity or category quantity is decremented.

Receipt reads validate exact fields, identifiers, timestamp, timezone, item limits, arithmetic, demo status, zero charged amount and the canonical intent digest. The public projection excludes internal digests and private Blob URLs. Draft chat, pending facts and avatar data are not part of the listing or receipt storage protocol. Published venue/location/policy content is the reviewed listing snapshot. Receipts contain no attendee name/email/address/card/wallet data.

The public UI repeatedly identifies simulated checkout, no charge, no reservation and no valid admission. It sends no payment request. The receipt page performs a server read and offers JSON download. Client displayed totals are previews; authoritative totals come from the server receipt.

## Review findings resolved

1. Publication initially set a React intent state immediately before POST and relied on a later storage effect. The reviewer identified the reload/interruption gap. A dedicated small intent key is now saved synchronously before any publication request. Failure to save prevents POST. Checkout has the same durable-before-send behavior and explicit storage-failure response.
2. Receipt read validation initially checked digest format but did not recompute the receipt intent digest. It now checks the reconstructed listing/occurrence/items digest. A tampered stored-price/total regression verifies safe failure.
3. The live verification script initially wrote intent IDs only in finally. It now persists its fictional fixture IDs before the first POST, so a process interruption does not create another public record on rerun.

## Evidence and limits

Independent command:

`node --test tests/demo-publishing.test.mjs tests/listing.test.mjs tests/setup.test.mjs tests/publish-intent.test.mjs`

Result:45 passed,0 failed. The demo tests inject the SDK boundary and invoke actual route handlers. They cover same/different digest replay, same/different ID concurrency, hard quota races, crash/read-back reconciliation, reservation retry after full quota, fresh-adapter reads, metadata integrity, photos/pins/policies, server prices/shared baskets, receipt persistence, no stock consumption, PII/price injection, origin/size/malformed/unconfigured failures and immutable record intent behavior.

Also independently ran `node backend/verify-v2.mjs`: passed activation gates, publication origin/session/validation, verified-owner RPC payload, service credentials and storage rejection. All fetches were mocked. Source-loader imports are migrated for the added demo service.

Reviewed `scripts/verify-live-demo-publishing-v1.mjs` without executing it. It requires an explicit public-demo flag, uses fictional data, persists stable IDs, verifies replay/conflict, public listing read, combined basket11 rejection for shared10, server-priced receipt with zero charged amount and a separate receipt-page read. It performs no financial transaction or attendee-data collection. Its eventual output must be inspected before claiming hosted persistence.

Actual role/skills read: backend role/shared rules; brief-to-site; storage; architecture; domain/boundary discipline; idempotence; separate-before-serializing-shared-state; root-cause and proof guidance. Existing approved design, licenses and marketing gate remain.

This reviewer wrote only review artifacts. No source edited, package installed, preview server started, environment changed, secret read, deployment performed or live paid request made. Mock persistence checks prove application behavior rather than a connected Vercel store. PM owns full build, desktop/mobile walkthrough, actual hosted write/read and public release evidence.

Decisions needed: none within the agreed scope.
