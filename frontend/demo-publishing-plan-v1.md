# Anonymous demo publishing frontend plan v1

Brief: `brief/project.json` v62. Date: 2026-10-18. Frontend read the current brief, actual role/shared rules, existing Workspace/listing/setup code, bundled Next.js page/route guidance and relevant verification/storage skills. Existing design and licences remain.

## Journey and state

The owner reviews the complete ticket draft, then selects Publish demo listing. The new demo path requires no login. Legacy local/authenticated endpoints remain intact and separate. A disabled storage capability shows an explicit unavailable message and keeps Download draft available.

Publishing creates an immutable public snapshot containing all validated setup details, including venue photos, exact map links, restrictions, disclaimer and referral preferences. The client keeps its existing draft identifier. A separate UUID identifies each reviewed content snapshot. The same content reuses that UUID on retry, including after reload; a changed draft receives a new publication UUID. No edit to an existing published object is exposed. Stale published links disappear from the current draft after edits.

Public listing pages retain the existing listing preview and add an accessible demo checkout panel. Visitors select an occurrence and quantities across available ticket categories. Shared capacity applies to the combined basket. The panel displays the illustrative ticket subtotal and zero charge. It explicitly states that the demonstration takes no payment, reserves no inventory and creates no admission ticket. No personal information is requested.

A deliberate Complete demo order action persists an immutable confirmation through the server. Successful confirmation displays a permanent receipt link and a downloadable JSON record. The receipt repeats the demo status, zero charged amount and lack of admission validity. Real payment, email delivery, referral payout and inventory reservation are outside this flow.

## Contract agreement before implementation

Backend writes `contract/demo-publishing-v1.md`; Frontend will acknowledge exact adapter/receipt exports before coding. Proposed publish input is `{id,draft}`. Proposed checkout is `{id,occurrence,items:[{tierId,quantity}],acknowledged:true}`. Multi-category items support a single adult/child basket. All prices and capacity validation remain server authoritative. UUID identity supports retry after uncertain network outcomes without creating duplicate objects.

Private Blob storage uses create-only immutable records with hard global limits of 20 listings and 100 confirmations. Maximum publication body is 2 MB. Backend owns quotas, canonicalization, idempotency, validation, stored records and APIs. PM owns dependency installation, store provisioning, release and live verification. Frontend owns Workspace, the public listing route, demo checkout/receipt components and their scoped CSS, plus a public receipt route when the contract supplies its read adapter.

## Required verification

Check anonymous review/publish, a separate public read, multi-category/shared-capacity checkout, persistent confirmation, retry with the same content, edited-draft publication with a new identifier, disabled storage, quotas and errors. Confirm full setup data survives and no real payment or admission claim appears. Browser desktop/mobile evidence, complete build and final release are PM-owned. Specialists make no paid AI calls.
