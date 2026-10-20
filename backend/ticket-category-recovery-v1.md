# Ticket category recovery v1

Brief: brief/project.json v60, read after PM approved v3. Contract: contract/conversation-patches-v3.md, written and agreed with PM/Frontend before implementation. Current task only fixes shared inventory conversation; anonymous public publishing/buying is a separate future scope and is not implemented here.

## Exact owner problem and root cause

Assistant asked whether limit10 is shared across kids/adults or separately allocated. Owner answered it should between them. That answer means one shared pool10. The manual setup already supported setup.inventoryMode shared/allocated, but the AI schema, source/pending field allowlist and merge did not. The model could not apply the intended answer. Allocated validation derived totals from category quantities; a shared total conflicted and became the generic category question. Subsequent Nothing was retained as more unfinished category context rather than a no-change answer.

Local baseline probes reproduced generic rejection of conflicting category totals and unknown IDs, plus duplication from reused new-item tokens. The owner's exact missing-mode cause is fixed here; ID heuristics and broad new issue metadata were deliberately excluded by PM to keep the correction specific.

## Change

inventoryMode is now a supported compact text patch, provenance/pending field and internal setup merge field. It is validated with capacity/categories before final parseListing, so shared mode preserves one total10 across categories. It neither assigns10 to each category nor invents allocations. All category IDs, names, prices, descriptions and quantities are preserved unless explicitly changed. Shared categories may keep unknown quantities.

Provider patch.resolveFields is a required array with no extra unions. It settles an existing pending topic on an exact latest, explicit, applicable decline/keep answer. It never clears draft data or settles unrelated fields. Category questions do not authorize resolving independent price, capacity or schedule facts. Invalid or blocked proposals cannot be hidden by unrelated resolution metadata.

The explicit no-change answer outranks contradictory model edits to that topic before application. Therefore a model proposal for a new category named Nothing is ignored after the organiser declines category changes. The server settles the category context and offers review without changing the draft or scene progress. This uses the user's intent, not a generic loop counter.

Accepted shared mode removes retained pure pool-confirmation facts such as the owner's exact it should between them that were misfiled under ticketTiers by the old generic rejection. Genuine unfinished category pricing/name facts remain. The latest Nothing is not carried into unrelated pending schedule facts.

The prompt explains shared/allocated semantics, retained total evidence and Nothing/no-change handling. A capacity-related rejection asks a focused shared/allocation question rather than the generic category-add question. No model, paid-request, auth, payment, persistence or deployment changes by this agent.

## Files

- lib/conversation-state.mjs: inventoryMode allowlist.
- lib/claude-ai.mjs: inventoryMode text/canonical enum plus compact resolveFields decoder/schema.
- lib/setup.mjs: merge inventoryMode through existing setup validation.
- lib/conversation-patches.mjs: atomic inventory application, scoped no-change resolution and targeted stale-pool-context migration.
- app/api/chat/route.js: conversational instructions.
- tests/provider-fixture.mjs, tests/claude-schema.test.mjs, tests/setup.test.mjs: schema/fixture migration.
- tests/conversation-patches.test.mjs and tests/claude-ai-route.test.mjs: exact and adversarial domain/actual-route regressions.
- Frontend's separate handoff: frontend/ticket-category-recovery-v1.md; manual mode edits clear corresponding pending context.

## Evidence

Ran `node --test tests/claude-schema.test.mjs tests/conversation-patches.test.mjs tests/claude-ai-route.test.mjs tests/claude-ai.test.mjs tests/setup.test.mjs`:105 passed,0 failed.

The actual route test intercepts compact Claude output through the real decoder and application. A retained limit10 plus it should between them produces shared mode/capacity10 with every adult/child category field preserved. A subsequent Nothing with stale category context produces no draft changes, no new tier, cleared category pending, a review question and a correctly signed optional spoken response. One intercepted provider call per turn, no retries. Additional tests cover shared incomplete quantities, unrelated pending facts, latest evidence, rejected/blocked resolution protection, wrong proposed Nothing tier, selective old-context cleanup and14union/0optional schema guard.

No paid service call, secret read, environment mutation, preview process or deployment. PM owns live two-turn smoke, final build/full suite/deployment. Independent reviewer inspecting final source. Decisions needed: none for this fix.
