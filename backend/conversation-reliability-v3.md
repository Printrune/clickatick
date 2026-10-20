# Conversation reliability — Backend v3

Brief: brief/project.json v58.2026-10-18. Internal provider contract: contract/conversation-patches-v2.md, agreed with PM before implementation. Browser/domain behavior remains the v1 contract. Supersedes the provider-schema portion of backend/conversation-reliability-v2.md.

## Correction

The wide nullable provider schema exceeded Claude's documented16union-typed parameter limit. Earlier mocked response tests and a successful deployment did not prove provider schema compatibility. PM discovered this before the first paid production request and owns rollback/redeployment. No paid request by this agent.

The provider now emits compact typed text/flag entry arrays, alongside nullable duration/category/schedule/payment groups. Empty entry arrays preserve unchanged values. The actual schema has14union-typed parameters and0optional parameters. All objects remain closed with required properties. The provider DTO is decoded once inside the Claude network adapter into the existing flat domain patch. No legacy wide provider DTO is accepted in production; the browser contract and Frontend state need no change.

Malformed types, missing DTO properties, unknown fields and duplicate canonical field entries produce an explicit provider-format error. Valid typed values with invalid business meaning still reach domain validation and normal clarification. New categories still receive server UUIDs; structured provider categories preserve nullable subfields. Runtime semantics remain authoritative.

A recursive pre-request guard counts unions and optional parameters across the actual schema. More than16unions or24optional parameters fails before fetch. A repeated descriptor counts at each parameter occurrence. Cyclic schemas fail explicitly. This prevents recurrence of the known explicit-limit failure. Official docs also describe internal grammar-size/compilation limits, so a14/0 schema count is not claimed as live provider acceptance. PM performs live verification before service-success claims.

Provider enum identifiers are canonicalized case-insensitively as documented: text/flag field names, type/ticket-format choices, schedule kind, payment methods, clear fields and provenance/pending field names. User titles, wording and quoted evidence preserve exact case. Unsupported enum values remain rejected or domain-clarified according to their DTO type.

Sonnet5.5 model/settings,1800output cap, request/time bounds and no automatic retry/fallback remain unchanged. No environment activation or spend change.

## Files and verification

- lib/claude-ai.mjs: compact schema, complexity preflight, DTO decoder, casing normalization.
- app/api/chat/route.js: prompt aligned to text/flags entries and nullable groups.
- tests/claude-schema.test.mjs:7 new recursive/schema/decoder/preflight regressions.
- tests/provider-fixture.mjs: test-only flat-domain-to-provider fixture adapter; no production legacy support.
- tests/claude-ai.test.mjs and tests/claude-ai-route.test.mjs: provider mocks migrated to actual compact DTO.
- tests/setup.test.mjs and tests/ticket-format.test.mjs: schema assertions migrated.

Ran `node --test tests/claude-schema.test.mjs tests/claude-ai.test.mjs tests/claude-ai-route.test.mjs tests/setup.test.mjs tests/conversation-patches.test.mjs`:97 passed,0 failed. Provider mocks are intercepted. Tests prove actual14/0 count, nested/reused union count,17union and25optional rejection, actual completion fetch0 on overflow, guard-before-fetch placement, unchanged1800cap, scalar/group decoder, malformed/unknown/duplicate/legacy rejection, casing compatibility, actual route success/clarification, retained domain protections and service failures. PM owns final build/full suite/browser/deployment; independent reviewer is checking final source.

Official documentation read: https://platform.claude.com/docs/en/build-with-claude/structured-outputs#schema-complexity-limits . It documents16union parameters,24optional parameters, internal grammar limits and case-insensitive enum comparison guidance.

No additional owner decisions. No secret reads, paid calls, new processes or deployment by this agent.
