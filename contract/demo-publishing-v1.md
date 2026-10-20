# Anonymous public demo publishing v1 — agreed proposal

Brief: brief/project.json v62 (scope approved in v61).2026-10-18. Backend wrote this contract before implementation. Frontend agreed the publish/multi-item checkout wire and shared validator direction; PM approved private Blob, immutable records, global20listing/100receipt cap and2MB body limit. Frontend will acknowledge the exact final file before code.

## Scope and capabilities

Review then Publish creates a public demo listing without login. Draft/messages/pending facts remain on the creator's device; publishing never resets them. A changed listing publishes as a new immutable version with a new publish UUID. Public visitors can complete a simulated purchase and open a persistent demo confirmation. No money, payment credentials, attendee personal data, stock reservation, valid admission, real email or payout service.

`connections.demoPublishing` is optional true only when DEMO_PUBLISHING_ENABLED=true and private Blob credentials/configuration are present; omit when unavailable to preserve existing connection shapes. This is configuration readiness, not a storage-success claim. Existing legacy authenticated/local publishing remains separate and unchanged. Previously published demo records can be read when storage is configured even if new writes are disabled.

Backend owns `lib/demo-*`, `app/api/demo/*`, shared listing validation extraction, and small services connection addition. PM owns package/env/provisioning/deployment. Frontend owns Workspace, public listing/receipt pages, DemoCheckout and styles. Never add an in-memory production fallback or claim success while storage is unavailable.

## Listing creation

POST `/api/demo/listings` JSON `{id:string,draft:Listing}`. id is a client-generated UUIDv4 for this canonical reviewed content, separate from the local draft ID. Persist the publish intent key locally across retry/reload. Same id and canonical content is an idempotent replay. Same id with changed content returns409; user edits generate a new publish intent without resetting the local draft.

Require same origin; stream-bound the request to2MiB before JSON parsing. Validate UUID and parseListing. New shared `lib/demo-validation.mjs` exports `demoPublicationErrors(draft)` and `demoOccurrences(draft)`. Extract common `listingRequiredErrors` from current publicationErrors so legacy extended-setup gate stays unchanged. Demo validator allows and preserves extended setup, venue photos and exact map pins; uses existing core completeness and schedule/timezone/DST checks. Nonempty disclaimer requires organiser review flag; known location must be an address, but a map/photo is not newly invented or silently discarded. Missing data yields400 with readable fields; no write.

Success201 created or200 replay: `{id,url:'/listing/<id>',demo:true}`. No secret/blob URLs returned. The listing is an immutable snapshot; API has no update/delete endpoint.

Server adapter `readDemoListing(id)` returns null when absent or `{id,draft,createdAt,demo:true}` when found. Public `/listing/[id]` first reads this demo projection, then can use existing legacy/local read behavior when absent. Storage errors are explicit load failures, not false not-found or fabricated content.

## Demo checkout and receipt

POST `/api/demo/listings/[id]/checkout` JSON exactly `{id:string,occurrence:string,items:[{tierId:string,quantity:integer}],acknowledged:true}`. id is an independent client UUIDv4 idempotency key retained for this checkout content; occurrence is a listed local YYYY-MM-DDTHH:mm (including an enumerated weekly occurrence). At most10 distinct category rows and20 tickets in total, each quantity1..20. Unknown fields, PII/payment fields, duplicate categories, invalid selections or unacknowledged demo status return400 before write.

The server reads the immutable published listing and derives category names, USD prices and totals itself. Client cannot supply trusted prices/fees. tierId is an existing category UUID, or literal general when no categories exist. Each order respects its listing's stated shared total or per-category allocation. Demo orders never reduce any real or global stock; multiple visitors can repeat a simulation. The UI clearly labels the action and confirmation as a demo, with no charge or valid admission.

Success201 or200 replay: `{receipt,url:'/receipt/<receipt.id>'}`. Receipt shape: `{id,listingId,title,timezone,occurrence,createdAt,demo:true,status:'demo',currency:'USD',items:[{tierId,name,quantity,unitPriceCents,lineTotalCents}],totalCents,chargedCents:0}`. No purchaser name/email/address/card/wallet or conversation data. Store a real immutable record before returning success. The complete simulated ticket price is shown without added buyer fees; no payment-processor capability is implied.

Backend `readDemoReceipt(id)` returns this public-safe receipt or null. Frontend owns `/receipt/[id]` SSR page and JSON download. The immutable server-read record is a demo confirmation, not an admission credential; no signature or QR ticket claim is needed. Browser success alone is insufficient evidence of persistence.

## Private Blob and bounded anonymous use

Installed @vercel/blob2.8.2 declarations verify private get/put and no-overwrite options. Use a dedicated clickatick-demo/v1 namespace only. put uses access private, addRandomSuffix false, allowOverwrite false, contentType application/json and bounded abort deadline. Use get with access private and useCache false for idempotency/race verification. No credentials, private Blob URL or raw SDK errors are exposed.

Immutable listing path is keyed by publish UUID and receipt path by receipt UUID. Store a canonical validated content digest with internal metadata. Existing same-id/same-digest returns original record; same-id/different-digest409. On write collision/unknown outcome, read back and compare instead of overwriting or claiming success. Snapshot timestamps come from the first persisted record and do not affect request digest.

Hard global quota:20listing records and100receipt records for this demo namespace, enforced with fixed create-only reservation slots in Blob. Concurrent invocations cannot claim the same slot because overwrite is forbidden. Retry adopts its own existing reservation; a crash may conservatively consume a slot. No daily reset, automatic deletion or background cleanup. Exhaustion returns429 with an explicit demo-capacity message. A bounded process-local POST rate guard supplements the persistent cap; it is not described as a distributed limiter. Publish bodies and stored listing objects are at most2MiB, receipts at most16KiB, bounding20listing data below50MB plus small receipts/reservations. Reads remain public-safe and cacheable as immutable content. Storage and platform quotas still need real verification; no guarantee of unlimited free usage.

## Errors, security and recovery

400 validation,403 origin,404 unknown listing/receipt,409 idempotency conflict,413 size,429 process/global demo limit,503 unconfigured or storage unavailable. Responses use fixed safe messages and no secrets/provider excerpts. Malformed JSON does not write. Every POST checks origin and size before mutation. Server read adapters validate stored schema/version and bounds. No user-provided path, external URL or filename reaches Blob SDK; validated UUIDs select fixed paths. There is no unpublish/edit capability without a separately designed ownership mechanism.

## Alternatives and evidence

Immutable private Blob is suitable for this bounded public demo because it needs no mutable stock or multi-record sale transaction. Existing authenticated database publishing would retain the rejected login dependency. A transactional database remains the appropriate future choice for real inventory, editing, payments/refunds and ownership; none is silently simulated here.

Required tests: injected actual SDK boundaries plus actual routes; concurrent same/different IDs, same/different digest replay, crash/read-back reconciliation, hard quota races, invalid/oversize/origin/unconfigured requests, shared10 adult/child selection, server-derived totals, no PII/charge/stock change, photos/maps/policies roundtrip, read-after-create through a fresh adapter, and legacy publication regression. Browser desktop/mobile Review→Publish→public listing→demo checkout→persistent receipt after reload. Real Blob write/read required before claiming live persistence; labelled fixtures can verify UI while provisioning is pending.

Official references read: https://vercel.com/docs/vercel-blob/using-blob-sdk and installed node_modules/@vercel/blob/dist/index.d.ts (2.8.2). Actual docs confirm private reads, create-only no-overwrite writes and consistent reads. No service configured or success claimed by this contract.

Exact module interface agreement: `lib/demo-validation.mjs` exports demoPublicationErrors(draft), demoOccurrences(draft)→local date/time string array, demoTicketTypes(draft)→[{id,name,priceCents,capacity:number|null}], MAX_DEMO_TICKETS=20 and MAX_DEMO_ITEMS=10. A shared category's capacity is the shared total for per-row UI bounds; combined order validation enforces that total once. `lib/demo-service.mjs` exports readDemoListing(id), readDemoReceipt(id), demoStorageConfigured() and demoPublishingReady(). Frontend imports only the shared validation module in client code and the service read functions in server pages. Readiness supports BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID plus VERCEL_OIDC_TOKEN. It never changes the legacy publishing boolean or authentication behavior.
