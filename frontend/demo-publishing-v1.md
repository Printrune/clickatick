# Anonymous demo publishing frontend v1

Brief: `brief/project.json` v62. Contract: `contract/demo-publishing-v1.md`, read and agreed with Backend before implementation. Date: 2026-10-18.

## Delivered behavior

Hosted Workspace now offers Review then Publish demo listing without login when the capability is configured. Extended setup is validated with the shared demo validator rather than blocked by the legacy publication restriction. Existing local publishing and authenticated API routes remain separate. Disabled demo storage is described as unavailable, and Download draft remains available.

A publication intent is separate from the local draft ID. `lib/publish-intent.mjs` hashes the canonical parsed snapshot, including setup, photos and precise pins. Identical content reuses its UUID for retry; changed content creates a new UUID. The dedicated small retry record is saved synchronously before POST. If that save fails, no write is attempted. Full draft persistence also keeps the intent. This closes the reload gap between setting React state and its later storage effect. Existing draft edits clear the displayed published URL.

Public `/listing/[id]` reads the persisted demo snapshot through the server adapter, preserves the complete listing/setup preview, and presents a demo checkout. Legacy listing reads remain fallback behavior. Storage errors are explicit load failures. Checkout supports an occurrence and multiple ticket categories, with shared or allocated quantity limits and a maximum of 20 tickets. The server derives authoritative totals; the client sends no prices or personal information.

The demo acknowledgement and action state that no payment, reservation or admission ticket is created. Checkout persists an independent UUID for the same selection before POST and reuses it after uncertain errors/reload. A successful response displays its server receipt, permanent `/receipt/[id]` link and JSON download. The receipt page performs a fresh server read. Every confirmation clearly shows zero charged amount and no admission validity. No real stock counter, payment, email, QR credential or referral payout is implied.

## Files

Frontend owns Workspace, `ListingPreview`, `DemoCheckout`, `DemoReceipt`, `app/demo-publishing.css`, the public listing/receipt pages, `lib/publish-intent.mjs` and `tests/publish-intent.test.mjs`. Public listing headings now use h1 while draft previews keep h3. Styling follows the existing purple direction and adapts to a single column on mobile.

Backend owns shared demo validators, private Blob adapters, APIs, quotas and authoritative receipts. PM owns storage provisioning, complete build, browser verification and release. No specialist preview process or hosted storage/AI call was made by Frontend.

## Evidence

`node --test tests/publish-intent.test.mjs tests/chat-client.test.mjs tests/voice-conversation.test.mjs`: 34 passed, zero failed. Four new tests cover canonical publication replay after reload, edited-content UUID replacement without draft reset, photo/pin participation in snapshot identity, and checkout selection replay/change.

The installed Next.js SWC compiler successfully parsed Workspace, DemoCheckout, DemoReceipt, ListingPreview, the public listing and receipt pages, and the publishing fixture. This is syntax evidence, not a production build or browser success claim.

## Labelled browser fixture

Source: `frontend/fixtures/demo/page.jsx.txt`. PM can install it at `app/dev-demo-check/page.jsx`, use a fresh origin such as port3033, then remove it before deployment. The deployment manifest already guards this temporary route.

The fixture initially mounts no Workspace. Load fictional demo draft writes only when no `ticketnest-draft` key exists; otherwise it refuses and leaves the existing draft unchanged. Continue existing draft opens the normal Workspace without replacing data, supporting explicit reload verification. Only `/api/demo/listings` is intercepted. The toolbar reports the last request UUID and simulated success/replay/error; Fail next publication produces one simulated503. All actions are explicitly labelled simulated and make no hosted storage writes.

Verify Review→Publish has no login, a failed retry retains the UUID, editing then republishing changes it, and reload preserves the prior retry identity. Actual hosted publish/read/checkout/receipt persistence must be independently verified through the real APIs before calling the flow live.

## Limits

No physical browser walkthrough, complete build, hosted storage write/read or deployment performed by Frontend. Public content is immutable; edits create a new published snapshot. The global demo limits are enforced by Backend. No claim of real ticket sales or payment support is made. Decisions needed: none.
