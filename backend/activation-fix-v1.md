# Claude activation diagnostics v1

Brief: brief/project.json version 25. Backend role and shared rules read. Owner approved direct Claude API and USD 10 total prepaid testing, with automatic refills off. The Product Manager owns actual paid verification.

## Change

`lib/claude-ai.mjs` now parses failed provider responses only to classify safe fixed messages. Whitelisted classes: low credits, unavailable model, invalid schema/format, invalid request, authentication, permission, rate limit, request size, overload, unavailable. Error objects include an internal fixed code and upstream status. The current route exposes the fixed message only. Raw provider messages, request bodies, and credentials are never returned or logged. There are no retries.

The safe low-credit message explicitly keeps automatic refills disabled. This diagnostic does not establish a real balance or successful generation.

## Provider compatibility evidence

Official Anthropic structured outputs documentation, checked 2026-10-18:
https://platform.claude.com/docs/en/build-with-claude/structured-outputs

The compatibility section includes Haiku 4.5. The migration section states output_config.format replaces output_format, and beta headers are no longer required. Existing request shape was preserved. No speculative provider switch or schema change was made before reading a specific diagnostic.

## Verification

`node --test tests/claude-ai.test.mjs`: 28 tests passed. Fourteen new cases cover fixed diagnostic categories, secret-canary non-disclosure, and one request only. All provider traffic in these tests is intercepted. No service key was accessed, no real provider request was made, and no money was spent by this specialist.

## Remaining

PM must redeploy and test the protected deployed flow. A production response will determine whether the actual blocker is account balance, request compatibility, or another class. No owner question is required from this specialist.
