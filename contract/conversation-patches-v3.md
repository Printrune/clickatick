# Conversation patches v3 — shared inventory and settled pending changes

Brief: brief/project.json v59.2026-10-18. Proposed minimal correction for the owner's exact conversation; PM approved direction and Frontend agreed the additive inventoryMode field before code. Browser listing and conversationState version remain unchanged. No issue-metadata architecture or generic loop counter is introduced.

## Verified root cause

Owner answered that the limit of10 is shared between adult and child tickets. setup.inventoryMode already supports shared/allocated manually, but the provider schema, source/pending allowlist and domain merge cannot express it. Allocated parsing derives total from category quantities; attempts to set a shared total conflict and collapse into the same generic category question. The model never receives a representation that can apply the user's shared-pool answer. Repeating the answer cannot repair that missing capability.

## Inventory change

Add inventoryMode to the existing compact patch.text field enum and provenance/pending field enum. Values are shared or allocated, runtime validated. Add it to setup patch merge and the dependent price/capacity/ticketTiers/inventoryMode group. Apply mode before final parseListing so shared inventory preserves a total10 across all categories, without assigning10 to each category or inventing category allocations. Preserve category IDs, names, prices and quantities unless explicitly changed. Clarify a genuine inventory conflict with a focused total/allocation question instead of asking what category to add.

Existing pending shared-pool facts are passed to the model. Prompt explicitly instructs shared answers such as between them/both together/one total to set inventoryMode shared, using the previously explicit total if available. Separate allocations use allocated only when explicit. Do not reopen already answered category questions.

## Pending resolution, separate from deleting draft data

Provider patch gains required resolveFields:string[] (field allowlist), empty when none. This adds no unions; total remains14unions/0optional. Decoder turns it into the existing internal patch metadata. No legacy provider DTO; fixtures migrate atomically.

resolveFields can settle an existing pending topic that the organiser explicitly declines to change, e.g. nothing/keep them as is after a category change question. Require matching exact latest user source evidence, an explicit decline/keep instruction, and an applicable current question or explicitly named field. It never deletes or clears draft fields. It cannot resolve a field currently rejected in the same turn. Accepted draft changes still resolve their corresponding pending facts normally. Unrelated unfinished category-price/details remain until accepted or explicitly declined; accepting shared mode alone does not blindly erase all category facts.

Prompt: when the user answers nothing after asking what category to add/change, keep categories unchanged, resolve the pending category topic with latest-source evidence, and move to review or the next genuinely missing fact. Never make a category called Nothing, invent a new tier or ask the same generic category question again.

## Ownership and tests

Backend: compact schema/decoder/prompt, shared parser field allowlist, setup merge, domain application and tests; output backend/ticket-category-recovery-v1.md. Frontend: manual inventory-mode edit clears relevant pending inventory fields using the existing clearPendingFields mechanism; no wire shape/version change. PM owns exact browser state/live smoke/build/deploy.

Before implementation, confirm this resolveFields amendment with PM/Frontend. Tests: actual compact-provider route with adult/child tiers and total10, shared answer, previous rejected capacity/category pending, subsequent nothing resolution, preserve all category IDs/prices/quantities, no10-per-category allocation, rejection cannot be resolved away, unrelated pending facts retained, group validity and14union guard. No paid calls by specialist.

Migration detail: when an accepted shared inventory mode resolves a retained fact that is only a pure pool confirmation (for example the owner's exact it should between them), remove that stale ticketTiers fact. Keep every unrelated category name/price/quantity fact. This is a completed shared-choice answer, not a category edit or a blanket pending reset. Explicit scoped no-change answers take precedence over contradictory model edits before application, so Nothing cannot create a tier.
