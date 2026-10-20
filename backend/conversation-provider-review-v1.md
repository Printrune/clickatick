# Compact conversation provider review v1

Brief: `brief/project.json` v58. Contract: `contract/conversation-patches-v2.md`, agreed before this correction. Reviewed 2026-10-18. This review covers the provider representation and request compatibility. Browser and validated domain contracts remain unchanged.

## Result and earlier gap

No remaining blocking source finding in the compact provider change. Independent final run:97 schema/provider/route/domain/setup tests passed,0 failed.

The initial reliability review did not check Claude's explicit structured-output complexity limits. The wide response schema had31 union parameters, exceeding the documented16 maximum. Build success and mocked provider success did not establish provider acceptance. The initial review's clean result was therefore insufficient as a release compatibility check. PM reports the temporarily ready deployment was rolled back to the previously working release before paid production testing. This reviewer did not independently perform or verify that rollback.

## Official compatibility checks

Read the current official [structured-output documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs#schema-complexity-limits) directly. It limits union parameters to16 and optional parameters to24 per request. The actual compact schema contains14 unions and0 optional parameters. An independent recursive enumeration of every union path agrees with the application counter. All schema object properties are required and additionalProperties is false. The schema uses supported basic types, enums, anyOf and type arrays, with no unsupported numeric/string/array constraints or recursive references.

These explicit limits do not guarantee acceptance: the provider also enforces internal compiled-grammar size limits. A bounded live request remains necessary before claiming real provider success. The first schema compilation may add latency.

Read the official [Sonnet5.5 change guide](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5). The actual no-tool request uses between_tools thinking, low effort, and no incompatible extra thinking fields. That documented mode produces text-only responses without tools, matching the existing response block parser. The1800 output cap, timeout, credential gates and fixed model allowlist remain. No automatic retry or model fallback was added.

## Representation and guards

Text fields travel as typed field/value entries; booleans travel in a separate flags array. Nullable duration, categories, schedule and payment preferences supply the remaining unions. `decodeProviderAnswer` runs at the network boundary and returns the existing flat patch. No compact DTO reaches the browser or changes pending-state semantics.

Decoder checks reject incomplete/legacy envelopes, duplicate canonical field entries, unknown fields and malformed DTO types as explicit safe provider-format failures. Business-invalid strings, such as an unknown price or capacity phrase, still reach domain validation and clarification. Enum identifiers normalize casing as documented without changing organiser text or source excerpts. Existing tier and schedule nulls preserve unchanged values.

The recursive preflight counts nested/reused inline descriptors per occurrence and checks16/24 before fetch. The deployment manifest also invokes this check, so the task's deployment tool rejects an over-limit schema before upload. This is an explicit-complexity guard for the current inline schema, not a replacement for live grammar compilation.

## Evidence

Independently ran:

`node --test tests/claude-schema.test.mjs tests/claude-ai.test.mjs tests/claude-ai-route.test.mjs tests/setup.test.mjs tests/conversation-patches.test.mjs`

Result:97 passed,0 failed. Tests cover actual14/0 counts,17 unions,25 optional fields, an oversized actual completion rejected before fetch with zero calls, flat decoding, required/closed objects, duplicate/unknown/legacy/malformed DTO rejection, casing, route migration and domain behavior. The setup schema assertions and actual route/provider fixtures use the compact shape. The test-only fixture adapter is not a production fallback.

Additional independent probes enumerated14 union paths, decoded text/flags/duration into the flat patch, and rejected duplicate fields, unknown fields, old wide patches and wrong boolean types. No paid API request was made. No source, environment or deployment was changed by this reviewer; only review artifacts were written. PM owns build, browser, deployment, rollback and live smoke evidence.

Decisions needed: none. Live provider acceptance remains unverified by this review.
