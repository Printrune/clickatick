# Public demo publishing v3 — optional description

Brief: brief/project.json v67. PM and Frontend read and approved this addendum before implementation on 2026-10-18.

The public demo accepts event and activity listings with an empty description. Keep the canonical Listing shape unchanged: description remains a string, defaults to an empty string and retains its 4,000-character limit. Existing nonempty descriptions and canonical content digests do not change. Title, location, price, capacity, complete schedule, valid ticket categories, timezone and disclaimer review retain their existing publication rules.

Backend changes listingRequiredErrors(listing, {requireDescription = false} = {}) so the shared demo validation omits description from its required fields. The legacy publicationErrors adapter explicitly passes requireDescription:true: database/setup.sql still has a nonempty-description table constraint and RPC validation. This change does not pretend that legacy database publication supports empty descriptions or alter its SQL. The current anonymous Blob publication path supports empty descriptions end to end.

The conversational assistant treats description as optional. It must not block review on missing description or invent description content when the organiser skips it. Provided descriptions remain editable and bounded.

Receipt confirmation downloads remain available. Frontend removes Download draft controls and stale download advice, marks description optional, removes description from completeness/progress, and hides blank descriptions on the public listing. After a successful persisted publication response, it validates the relative same-origin /listing/UUID URL and navigates there. Failed publication must keep the draft and must not navigate. No request or response shape changes.

Ownership: Backend owns validation, assistant prompt, actual-route regressions and backend/optional-description-v1.md. Frontend owns Workspace, progress, listing rendering, navigation and its tests. Tests must prove complete event and activity drafts publish and read with description:'', other required details still reject, oversized descriptions reject, legacy validation stays honest, and existing canonical records replay with unchanged digests. No paid AI requests or deployment by specialists.
