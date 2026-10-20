# Conversation reliability — Backend v2

Brief: brief/project.json v58.2026-10-18. Contract: contract/conversation-patches-v1.md, amended and agreed with PM/Frontend before implementation. Supersedes the date-only experiment; that helper and production caller were removed in this wave.

## Implemented behavior

The provider now returns changed-field patches instead of regenerating the full listing. Null or omitted fields preserve accepted data. Existing validators apply independent fields and atomic dependent groups. A malformed price, capacity, timezone, date, category, setup field or other editable proposal becomes a normal spoken clarification. Valid independent changes persist. Price and capacity are independent when no categories make them interdependent. Invalid member selection comes from candidate validation, not matching validator error text.

The accepted listing never contains partial dates or invalid values. Bounded conversationState keeps exact unresolved user words, including separate date/year/time answers, across history trimming. Provenance checks require exact latest-user or retained-pending excerpts. Older resolved conversation cannot authorize replaying a prior change over manual edits or duplicating a category. Pending fields resolve only when their actual proposed values are accepted; an empty schedule object or changed timezone cannot erase unfinished schedule evidence. Explicit manual edits clear corresponding pending fields on the client under the agreed amendment.

If a group is rejected, the provider acknowledgement is discarded. The server asks one relevant question and retains accepted values. Dependent derived fields cannot be falsely reported changed or cleared. Explicit clearing requires an affirmative, field-specific user instruction. Blank nested fields, empty arrays, negated remove commands and unrelated remove evidence cannot silently clear saved data. Pending overflow preserves the prior state/draft and explicitly explains that the new answer is not saved; no silent eviction.

Category changes are upserts with server-assigned UUIDs for new-item tokens. Existing IDs are preserved and omission does not delete a category. Address changes preserve media, clear old pins, and changed disclaimer text resets its review flag. AI cannot write media/pins or approve disclaimers. No change to auth, publication, payments, confirmation delivery or payouts.

The model prompt supports semantic interpretation: natural spoken quantities/prices, relative dates using supplied today/explicit anchors, and unambiguous location-to-IANA timezone resolution. Unknown year/time still requires clarification; no invented midnight. The initial New York timezone is identified as a UI default rather than a confirmed organiser answer. Actual semantic quality remains model-dependent; bounded recovery handles invalid proposals.

Genuine credential, quota, network, incomplete/truncated or unreadable provider output remains an explicit draft-safe error. No automatic retry or model fallback. User-triggered retry belongs to Frontend.

## Models and spend

Supported allowlist: default claude-sonnet-5-5 and explicit legacy claude-haiku-4-5-20251001. Sonnet sends thinking:{type:'between_tools'}, output_config.effort:'low', structured JSON schema, no tools/temperature/other thinking fields. Legacy uses compatible settings without Sonnet-only fields. Unsupported models cannot activate. Output cap1800, request cap40000bytes and45second timeout remain. No environment activation or paid request by this agent. PM owns the production AI_MODEL update within the existing USD10 prepaid/no-refill allowance.

Official docs read: https://platform.claude.com/docs/en/models/sonnet-5-5/overview and https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5 . Sonnet5.5 API ID and $2input/$10output per1M tokens confirmed; between_tools disables up-front thinking. No live access/quality claim from fixtures.

## Files and evidence

- lib/conversation-state.mjs: shared browser-safe parser; v1,12facts,500characters each,6000UTF8bytes.
- lib/conversation-patches.mjs: grounded nullable changes, domain groups, pending context and clarification.
- lib/claude-ai.mjs: schema/model allowlist/settings.
- app/api/chat/route.js: request/state validation, conversational prompt, application and correct optional speech ticket.
- .env.example: documented model selection; no secrets or activation.
- tests/conversation-patches.test.mjs, tests/claude-ai-route.test.mjs: direct module and actual route/provider interception.
- tests/claude-ai.test.mjs, tests/setup.test.mjs, tests/ticket-format.test.mjs: migrated schema and route-loader coverage.

Ran `node --test tests/conversation-patches.test.mjs tests/claude-ai-route.test.mjs tests/claude-ai.test.mjs tests/setup.test.mjs`:90 passed,0 failed. Covers all field families, mixed valid/invalid groups, screenshot relative phrase, complete relative interpretation proposal, pending year/time retention/trim, explicit clears, no-change empty schedule, category IDs/upserts/derived totals, location media/pins, provenance, old price/category replay prevention, state bounds/overflow, manual-compatible response shape, signed spoken clarification, model settings, genuine provider401/429/500 and truncated/unreadable output. All provider requests intercepted;0paid requests. Browser/full-suite/build/deployment verification belongs to PM; independent reviewer inspecting the final source.

## Limits and decisions

Source provenance and value validation do not prove perfect language understanding. Typed nullable patches prevent accidental whole-document regeneration, and tests verify truthful recovery when interpretation fails. Pending context is local draft context, not account storage. Exact maps, payments and admission issuance remain outside this change. No new owner decision is needed.
