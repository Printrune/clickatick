# Story backend review v1

Brief version 22. Contract `contract/story-api-v1.md` was written before implementation, using the Product Manager agreement.

## Changes

Canonical `ticketFormat` accepts unknown, digital, paper, or both. Missing fields in legacy drafts become unknown. Other values fail at the input boundary. The Claude structured schema includes the field and the prompt asks only event and ticket questions, preserves known preferences, and does not infer personal characteristics. The listing preview states the selected delivery format or To confirm. Unknown format does not block publication, preserving compatibility with existing listings.

Existing event JSON content storage retains the field. No database schema migration was needed. This describes organiser ticket delivery, not admission ticket issuance. No credentials, live AI requests, accounts, or spending gates changed.

## Evidence

`node --test tests/ticket-format.test.mjs tests/listing.test.mjs tests/claude-ai.test.mjs tests/claude-ai-route.test.mjs` passed 29 checks but the actual disk engine aborted within the filesystem sandbox. The recorded failed process finished before the retry.

`node --test tests/ticket-format.test.mjs` outside the filesystem sandbox passed both tests, including actual local PostgreSQL publish, update from digital to both, disk close/reopen, and restored format/capacity checks. Thus the combined focused set has 30 passing checks across the original isolated checks and successful disk retry. No live provider request occurred. Existing Claude route tests intercept all fetches.

## Remaining verification

The Product Manager owns the explicit ticket editor and evolving scene. Check browser behaviour and phone/paper scene props in the integrated version. Camera and voice personalisation are outside this backend task.

Decisions needed: none.
