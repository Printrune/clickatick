# Publish redirect and optional description v1

Brief: `brief/project.json` v67. Contract: `contract/demo-publishing-v3.md`, read and acknowledged before caller changes. Date: 2026-10-18. Light-mode implementation is retained.

Removed every draft download control and the dead Workspace download function, including reset confirmation and unavailable-login states. Removed related recovery advice. Location-photo copy now explains that photos stay with the draft and are included when published. Receipt confirmation downloads remain available.

Both description editors now say Description (optional). Draft completeness uses five groups and omits description. A blank public description produces no placeholder paragraph. Existing nonempty descriptions remain visible and editable. Backend owns the matching demo validator and assistant changes; legacy SQL publication keeps its existing nonempty-description requirement.

After the server confirms publication success, Workspace validates the returned exact relative `/listing/UUIDv4` path and navigates there. The existing public route reads the persisted snapshot. A failed request or invalid URL does not navigate or reset the draft. Canonical snapshot hashing, synchronous retry-key storage and replay behavior remain unchanged.

`publishedListingPath` rejects external/protocol-relative URLs, query strings, fragments, trailing newlines, traversal, wrong routes and malformed identifiers. Five publication-intent tests and four theme tests passed. Next.js SWC parsed all eight affected JSX/layout/fixture sources. No copy-only tests were added.

The labelled publishing fixture now supplies an empty description. Its successful simulated API response navigates to the expected listing URL; without a real stored fixture record, that local route can correctly return404. This proves navigation only, not hosted persistence. PM verifies actual hosted empty-description publication/read separately and owns browser proof, complete build and deployment.

No preview server, paid call or deployment by Frontend. No payment, inventory or admission behavior changed. Decisions needed: none.
