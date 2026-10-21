# clickatick full-system integration contract v3

Date: 2026-10-20. Shared brief v84. Prospective contract for the first public catalog slice; no implementation predates this agreement. The owner decided the Lovable ticketing system becomes the main product, with clickatick's conversational creation retained. Checkout remains a demo until a verified payment provider is connected. Organizer sign-in is approved; provider is pending.

## Public catalog read

The existing private Blob demo store remains the only hosted source for the first slice. `lib/demo-service.mjs` gains `readDemoCatalog()`, which scans the existing bounded 20 listing reservation slots, validates every present claim's version, kind, ID and digest, then loads each matching listing through the existing validated service path. Empty slots and valid orphan claims without a listing are skipped. A malformed claim, digest mismatch, invalid listing or unavailable storage fails the read rather than showing partial or unvalidated data. Results sort by `createdAt` descending, then ID ascending. The function is read-only and performs no paid operation.

Each catalog card is a small public projection: `{id,title,type,description,location,scheduleLabel,price,capacity,createdAt,demo:true}`. Do not return the full draft, full-resolution artwork, creator hash, capability, buyer record, storage path, or private ticket data. The text fields are already bounded by `parseListing`. A future thumbnail needs a separate bounded media contract.

The Next.js `/discover` route renders that catalog server-side. Its case-insensitive search and type filter operate on returned public title, description, venue address, and event/activity type, using URL parameters `q` (bounded to 100 characters) and `type=event|activity`. Each card links to the existing `/listing/[id]` public route. The page must state that checkout is a demo. It must distinguish an empty catalog from unconfigured or unavailable storage. No buyer or organizer private data is included. No new public JSON endpoint is required for this slice.

## Existing routes retained during migration

`/` remains the current conversational creator until the owner decides homepage placement. `/listing/[id]` remains the event detail/demo checkout route. `/receipt/[id]` remains a zero-charge demo confirmation. No route may label a demo receipt as an admission ticket or a confirmed sale. Old Lovable React Router paths are not mounted.

## Out-of-scope contract decisions

Organizer sign-in was approved, but provider and new transactional database remain pending. So do admission QR, transfer, scan, box office, analytics of real orders, email delivery, promo redemption, and referral payouts. The raw Supabase tables, client checkout, payment selectors and policies are not imported. Public catalog does not change any of those decisions.

## Frontend/backend agreement

Backend owns `readDemoCatalog()` and its tests. Frontend owns `/discover` and navigation. Both use existing listing validation. Both reviewed the prospective contract and proposed the amendments now incorporated above. Their final approval of this amended contract is recorded in `handoffs/001-pm-api-v3-agreement.md` before coding.
