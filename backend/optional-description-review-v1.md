# Optional description and publish flow review v1

Brief/project.json v67; contract/demo-publishing-v3.md. Read-only review of the agreed public demo change. Source ownership remains with Backend and Frontend. No server, deployment, paid model or real storage calls.

## Backend result

No blocker found in the optional-description implementation. `parseListing` and the canonical object shape are unchanged. An empty description remains a string, provided descriptions retain the 4,000-character limit, and the immutable digest continues to hash the parsed listing. Existing nonempty canonical records are unchanged and replay without overwriting.

`listingRequiredErrors` omits description by default. Title, location, price, capacity, complete schedule and ticket-category rules remain. Demo validation retains disclaimer review, United States timezone and local-time checks. Legacy `publicationErrors` explicitly requests a description, matching the unchanged SQL constraint and RPC. The chat prompt explicitly calls description optional and prohibits invented text when skipped. A prompt test proves the instruction is present; it does not prove all future model responses comply.

Independent verification passed 35 tests across demo-publishing, listing and publish-intent, plus 14 actual chat-route tests. The new actual-route tests publish and fresh-read empty descriptions for an event and a weekly activity, preserve empty content on replay, reject missing core fields and oversized descriptions, verify the legacy requirement and compare existing canonical digests. `node backend/verify-v2.mjs` also passed with all fetches mocked.

## Frontend source review

Description is marked optional, removed from the five-group progress count, and not rendered as a placeholder on a published listing. Draft preview may still offer an optional description prompt. Publish validates and saves a durable intent before POST, waits for a successful response, validates the returned path and only then calls location.assign. The path validator accepts only a relative `/listing/` path followed by UUIDv4, preventing cross-origin navigation. Exceptions and non-success responses stay in the workspace without clearing the draft.

At first inspection one unavailable-publishing error still advised downloading a copy after the download controls were removed. This was sent to Frontend for final cleanup. Requested deterministic path-validator regressions for absolute/protocol-relative URLs, suffixes, malformed IDs and traversal. Runtime redirect, failed-publication retention and public blank-description rendering remain PM browser checks.

Final Frontend source removes the stale workspace advice and draft download controls. Five publication-intent tests now pass, including strict path acceptance and rejection of absolute/protocol-relative URLs, query/hash/newline suffixes, malformed IDs, wrong routes and absent values. Combined theme/intent rerun passed 9 tests. A final repository scan found inactive-AI copy in app/api/chat/route.js still offering draft downloads; Backend was notified for cleanup. This is stale advice rather than a persistence or navigation defect.
