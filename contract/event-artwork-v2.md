# Event artwork contract v2

Frontend and Backend agreed this interface before implementation. This document inherits the privacy, size, idempotency, quota, and feature-gate rules in `contract/event-artwork-v1.md` and fixes the response shape.

`draft.coverImage` is optional and immutable after publication: `{mime:'image/jpeg',dataUrl,origin:'scene'}`. The public `readDemoListing(id)` projection includes top-level `coverImage`, which is the active generated overlay when present, otherwise `draft.coverImage`, otherwise `null`. Existing drafts and records remain valid.

Successful `POST /api/demo/listings/[id]/artwork` returns `{coverImage:{mime:'image/jpeg',dataUrl,origin:'generated'},created:boolean}`. A repeat request returns the saved image with `created:false` and makes no provider call. The existing creator capability and same-origin rules apply. The public `readDemoReceipt(id)` projection includes the same top-level active `coverImage` for its listing; the persisted receipt record and exact-key validation remain unchanged. It is always a demo confirmation, never an admission ticket.

The checkout POST response also adds top-level active `coverImage` beside its existing `{receipt,url}` fields, so the in-page demo confirmation can display the same image without another request. This is a response projection only; stored receipt schema is unchanged.

Frontend renders the active `coverImage` on listing and demo ticket/confirmation. The original scene cover stays as fallback when no generated image exists or Gateway is unavailable. The browser captures and caches scene bytes before publication so retries send identical content. Generation is an explicit creator action and remains disabled until Gateway credit is confirmed; no automatic provider request runs on publish or page load.
