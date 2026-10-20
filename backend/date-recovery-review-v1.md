# Conversational date recovery — independent review v1

Brief: `brief/project.json` v57. Contract: `contract/date-recovery-v1.md`, agreed before implementation. Reviewed 2026-10-18. Backend role and shared workshop rules read. Actual skills read: brief-to-site, workshop-owner-language, principle-fix-root-causes and principle-prove-it-works.

## Result

No remaining blocking findings in the reviewed patch. The screenshot failure has a specific server boundary cause: a model-generated relative or incomplete date failed the existing strict schedule validator and became a request error. The new boundary returns a clarification through the unchanged successful chat envelope, so the existing voice controller can speak it and continue listening.

## Findings resolved during review

1. The initial year/time inference searched every number in user history. A quantity of 2026 or unrelated office hours could skip a required question. The implementation now uses explicit calendar context or short answers paired with focused assistant year/time questions, plus the accepted schedule. Adversarial route regressions cover both examples.
2. The setup test's data-URL route loader lacked the new helper import rewrite and failed with ERR_UNSUPPORTED_RESOLVE_REQUEST. The loader is migrated and passes.
3. The first context fix considered only the latest answer, causing a year/time clarification loop if malformed model dates persisted. The final helper retains focused question-answer context across the bounded request history. A three-turn relative-date/year/time route regression covers this case.

## Boundary and data checks

- The incoming draft still passes the full listing validator before any provider call. Invalid request schedules remain errors and make zero provider calls.
- Only model-produced invalid schedules enter recovery. The entire previously accepted schedule is retained. Other proposed fields must pass the complete listing validator; invalid non-date data remains an error.
- The replacement reply asks one date question and does not claim the rejected date was saved. No year, time or relative date is persisted by the helper.
- Optional speech tickets cover the replacement clarification rather than the discarded model reply.
- Same-origin checks, input bounds, server-only credentials, provider error classifications and existing service-error behavior remain intact. Recovery adds no provider retries or paid calls.
- The deployment manifest includes the new helper through the existing lib directory traversal. The development fixture remains guarded against deployment.

## Reproducible evidence

Independent command: `node --test tests/claude-ai-route.test.mjs tests/claude-ai.test.mjs tests/listing.test.mjs tests/setup.test.mjs tests/voice-conversation.test.mjs`.

Final result: 109 passed, 0 failed. These tests rehearse the actual chat handler with intercepted provider fetch, validate retained schedule/non-date fields and service failures, and exercise voice clarification followed by resumed listening. The initial failed loader and context counterexamples were independently reproduced before correction.

No source files changed by this reviewer. No server started, secret read, environment changed, deployment performed or paid request made. Browser release verification belongs to PM; physical microphone quality and live provider output remain outside these deterministic tests. Clarification context is deliberately conservative and is not a general natural-language date parser.

Decisions needed: none.
