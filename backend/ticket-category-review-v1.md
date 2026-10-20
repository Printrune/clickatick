# Ticket category conversation review v1

Brief: `brief/project.json` v59. Contract: `contract/conversation-patches-v3.md`. Owner's reported sequence: assistant asks whether a limit of10 is shared across adult/child categories; owner answers `it should between them`; assistant repeats `What ticket category would you like to add or change?`; owner answers `nothing`.

## Baseline reproduction

Independent pure-domain probes reproduced the repeated fallback before the correction. A single accepted Adult category at20 dollars/10 places plus a grounded top-level price12 proposal produced the exact generic category question on three successive answers, even after the user named Adult. The accepted price remained20 and pending facts grew by two per turn. A top-level capacity change also produced that same question. Invalid category quantity and unknown category identity paths collapsed to it too.

These probes demonstrate the representation dead end and loss of useful diagnostics. The owner's exact primary failure has a more specific cause: shared inventory already exists in manual setup and listing validation, but inventoryMode was absent from the AI schema, provenance/state allowlist and domain patch merge. A conversational shared-total answer could not be applied. Allocated category totals overrode top-level capacity, and the boundary mapped that mismatch to the generic category prompt. A loop counter would not repair the missing inventory operation.

The baseline new-token/name probe also showed that a new category token always creates a new ID, even when its name matches an existing category. That is diagnostic evidence rather than an additional implementation requirement in this scoped correction. Existing identity safeguards remain necessary.

## Contract review

No blocking issue in the agreed minimal direction. inventoryMode joins the coupled inventory group and is applied before final listing parsing. The result must retain one shared total10, category IDs, prices and quantities; it must not invent allocations. Mode and capacity must be applied together when the previously accepted allocated total differs from the user's intended shared total.

resolveFields settles declined pending conversation topics and does not clear listing data. It requires exact latest-utterance evidence and an applicable question or named topic. It cannot discard a rejected or blocked change in the same turn. This permits `nothing` after an add/change category question to leave categories intact and continue without false saved progress. Unrelated unfinished facts remain.

## Implementation review and findings resolved

No remaining blocking finding for the owner's exact shared-total/declined-category workflow.

inventoryMode now reaches the compact text DTO, source/pending allowlist, setup merge and coupled inventory group. Group application merges the shared mode before final domain parsing. The actual route regression starts with Adult/Child categories whose allocated quantities sum20 and a retained explicit total10. The answer `it should between them` accepts shared mode and total10 together while preserving every category ID, name, description, price and quantity. A separate regression accepts empty category allocation strings in shared mode without assigning10 to every category.

During review, two direct no-change failures were found and corrected:

- Inventory-wide resolution keywords initially allowed a category decline to settle independent price/capacity facts. Resolution now matches the individual topic; the category question cannot authorize those other resolutions.
- A contradictory model proposal could create a category called Nothing and still say categories stayed unchanged. The reviewer independently reproduced this. The server now recognizes the organiser's explicit scoped no-change answer before applying changes. It suppresses a contradictory edit to that topic and settles its pending context even when the model omits the resolution metadata. This changes pending context only, with no draft deletion.

Declining a topic cannot erase a rejected or blocked unrelated proposal. Old evidence cannot authorize a new decline. Unrelated pending schedule/price/capacity facts remain. The raw `nothing` answer is not appended to an unrelated pending topic. Prompt and server-owned reply move this category decline toward review instead of repeating the same category prompt.

The provider DTO adds a required resolveFields array and one text-field enum member; schema complexity remains14 unions and0 optional parameters. Decoder/fixture migration retains the existing flat browser draft/state contract. Manual inventory edits clear related pending inventory fields through the existing client mechanism. No generic loop counter or paid retry was added.

## Reproducible evidence

Independent final command:

`node --test tests/conversation-patches.test.mjs tests/claude-ai-route.test.mjs tests/claude-schema.test.mjs tests/setup.test.mjs tests/chat-client.test.mjs tests/voice-conversation.test.mjs`

Result:89 passed,0 failed. The actual compact-provider route test rehearses the owner's shared10 answer and subsequent `nothing`, preserves all categories, returns a review question and signs the actual returned speech. Each turn makes exactly one intercepted provider call.

A separate independent adversarial probe proposed a new Nothing category from the literal `nothing` answer. Final result: the existing Adult category and capacity10 remained, pending category context settled, the response said categories stay as they are, and acceptedDraftUpdate reported sceneChanged false. An independent schema counter returned14/0.

This scoped repair addresses the verified shared-inventory capability gap and declined pending changes. The baseline probes of scalar price updates and malformed/unknown tier identities remain evidence of other fallback paths; this review does not claim a general category-upsert normalization change or perfect model interpretation.

This reviewer changed only review artifacts, started no server, read no secret, made no paid request and performed no deployment. PM owns actual browser/live-model/release verification.

## Final shared-pool context migration check

Reviewed the final completedPoolFact guard. An accepted shared inventory change removes a stale ticketTiers fact only when its raw text is a pure shared-pool confirmation. It does not broadly discard category name/price facts. Independently ran the shared/pool/Nothing/category-decline focused regressions across domain and route tests:7 passed,0 failed, including the new pure-pool versus unfinished-pricing case. No new blocking finding.
