# Organizer phase A5 UX and route handoff v1

Date: 2026-10-21. Based on `brief/project.json` v104 and `integration/design/remaining-ticketing-scope-v1.md`. This proposes screens and contract questions; no A5 code or service is connected. Keep the approved clickatick purple Clear workspace, light/dark themes, and `/creator` conversation. Current A4 publication remains immutable until a new Frontend/Backend edit contract is agreed.

## Navigation and routes

Use one brand switcher in the organizer header. Keep five groups: Events, Demo activity, Promotion, Storefront, and Team and settings. `Create tickets` remains a clear path to `/creator`. Do not add dead navigation. Hide future groups until their first working screen exists; if a control is visible but gated, explain why.

| Route | Main task | Primary screen content |
| --- | --- | --- |
| `/dashboard/{brandId}` | Choose the next event task | Separate Drafts, Awaiting owner review, Published, and Cancelled lists; status and date; create draft. Never mix a private draft with a public listing card. |
| `/dashboard/{brandId}/events/{draftId}` | Prepare and review a draft | Existing A2 form and A4 publication gate. Add seat-map authoring and a clear change summary before owner approval. |
| `/dashboard/{brandId}/published-events/{eventId}` | Manage a public event | Overview with stable public URL, status, next date, configured ticket rules, media, and links to Page, Tickets and Seats. Owner-only edit/cancel actions. |
| `/dashboard/{brandId}/published-events/{eventId}/edit` | Prepare an in-place listing revision | Editable working copy based on public version; compare current public vs proposed; save privately; send material changes for owner review. URL remains `/events/{eventId}` after approval. |
| `/dashboard/{brandId}/published-events/{eventId}/activity` | Inspect demo activity | Counts of committed demo confirmations by occurrence/tier and recent no-PII activity. State that counts are simulations, not sales or attendance. |
| `/dashboard/{brandId}/storefront` | Manage public brand presentation | Display name, description, logo/banner if media gate allows, preview link and exact public status. A renamed display name does not change URL. |
| `/organizers/{brandId}` | View a public brand storefront | Brand identity and public event grid, including next dates and demo labels. Public URL uses the generated stable ID, never a mutable slug. Cancelled events do not appear in the active grid; direct cancelled event URLs remain readable. |
| `/dashboard/{brandId}/team` | Manage staff access | Member list with role/status, create private invitation link, email invitation form when delivery is connected, revoke/disable controls and pending invitations. Only owners see mutation actions. |
| `/invite/{token}` | Accept an invitation | Show brand name and proposed role before sign-in; preserve the invite token through Clerk Google/email sign-in; confirm acceptance and brand access only after server confirmation. |

Do not assume exact paths above are settled API routes. They are screen URLs for the PM to reconcile with Backend. Preserve existing `/`, `/discover`, `/creator`, `/events/{id}`, `/listing/{id}`, and `/receipt/{id}` during the migration.

## Screen behavior and states

**Published edits.** Draft a revision without changing the public page. Show a field-by-field summary for title, date/time, location/pin, photo, ticket types/prices, capacity, seating and policy text. Label material changes and require owner review before they appear. Editors may prepare and submit; owners approve. After approval, the public event URL remains stable and the visible event version changes atomically. Old demo confirmations keep their captured title, date, ticket/seat labels and illustrative amounts. A new quote must bind to the new version; an old uncompleted quote becomes stale. If approval fails, the current public page remains intact and the proposed revision stays recoverable.

**Seat-map authoring.** Add a section list beside a visual grid. Each section has name, row count, seats per row, tier compatibility and configured accessible seats. Selecting a cell updates a text list with section, row, seat number and accessibility; the list can select and mark seats without pointer drag. Show a running configured-seat count and enforce the existing 50-section/10,000-seat bounds before saving. A preview uses the same labels as the public seat picker. No copy says a seat is held or sold. On small screens, present the text list first and the grid below it; keep controls keyboard operable with visible focus.

**Staff invitations.** A private link has `created`, `copied`, `expired`, `revoked` and `accepted` states. Copying a link is not sending it. An email invitation has `draft`, `submitting`, `accepted-for-delivery`, `delivered`, `failed`, `expired`, `revoked` and `accepted` states only if the provider can prove each transition; otherwise show `delivery not connected` and no send action. Do not display an address after it becomes unnecessary. Role changes and member disable actions need confirmation because access changes immediately.

**Storefront.** Public page loads without sign-in. Show a usable brand header, organizer description and published event grid. If the brand has no public events, show a factual empty state. If media fails, show a labelled image fallback while text and event links remain. A disabled/suspended brand or unavailable database needs a distinct error state. Do not claim a custom domain or verified organization badge.

**Demo activity.** Count only persisted A4 demo receipts, not quotes, page views, seat selections or payments. Explain the distinction near the number. Show time buckets and event/occurrence filters only when the API supports them. If the count query fails, show unavailable rather than zero. No buyer identity, gross revenue, conversion rate, referrals paid or check-ins are available from demo receipts.

All screens need loading, empty, signed-out, membership-disabled, foreign-brand 404, conflict/retry and unavailable-service states. Preserve focus after save/review actions and at 320/390px and 200% zoom. No A5 action implies live payment, admission or email delivery.

## Backend contract questions before implementation

1. What is the public storefront projection and route? Agree stable `brandId`, display name, description, nullable media URLs, only published active events, pagination, and disabled-brand behavior. Define where cancelled events remain accessible directly.
2. What is the published-revision lifecycle? Agree `draft_revision → awaiting_owner_review → approved/rejected`, immutable snapshot version, material-change classifier, expected-version/idempotency rules, who may edit each field, and whether approval locks/invalidates open quotes. A4's source draft lock must stay intact.
3. What exactly is immutable in old receipts after an edit? The current A4 receipt lacks event title/date/place snapshot. Add a no-PII event/occurrence snapshot at receipt creation or a versioned read model, without mutating existing receipt records silently. Decide what the old receipt displays when the current event is cancelled.
4. What are the invitation security and delivery contracts? Specify role enum, token length/expiry/one-use or multi-use behavior, revocation, accepted membership, safe pre-sign-in preview, rate limits and audit trail. Email endpoint must distinguish accepted work from provider delivery; no client-supplied membership authority.
5. What is the seat-map authoring schema? Agree stable section/seat IDs, row labels, irregular or omitted seats, accessible marker storage, compatibility per tier, section versioning, and safe effects of changing geometry after a published event already has receipts. Public A4 seat IDs and old receipt labels must remain explainable.
6. What are demo activity metrics and retention? Define counting source, timezone, page size, time range, cancelled-event inclusion and reconciliation. Exclude PII, payments and admission by construction.
7. How do A3 media limits apply to storefront logo/banner and event video? The owner requested 100 images and 10 videos per brand, with videos up to 100 MB, under the shared free Blob 1 GB cap. Image size, video delivery and upload rate still require an approved contract. Keep upload controls gated until then.

The PM can resolve implementation details with Backend, then obtain owner approval for any new product choice one question at a time. Do not re-ask settled decisions: stable generated storefront ID, in-place owner-reviewed edits, staff link plus email invitation, accessible seats available to all, and demo-only checkout are already in v104.

## Delivery order and evidence

Recommend storefront read projection and public page first, since it has no mutation. Then add team link invitation and acceptance with connected identity; keep email delivery gated. Build the revision lifecycle and seat authoring together because changes to seating affect quote compatibility and old receipts. Add demo activity last from committed receipt rows. Each slice needs a versioned Frontend/Backend API agreement before code, focused tests, and a browser/API/data check with honest unavailable states. Marketing work remains after owner approval of a working site.
