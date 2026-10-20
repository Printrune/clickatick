# Conversational date recovery — Backend v1

Brief: brief/project.json v57. Date: 2026-10-18. Contract: contract/date-recovery-v1.md, agreed by PM and Frontend before implementation.

## Root cause and change

The user supplied `2 days before Halloween`. The provider response schema allowed any string in schedule.dates, while parseListing correctly required complete YYYY-MM-DDTHH:mm. A date-only or relative model value therefore threw `Check the individual dates.`. The chat handler returned400, which the voice controller treated as an assistant failure. This was independent of speech recognition interruption or browser audio quality.

Extracted the existing schedule parser without changing its accepted values. The new provider boundary in lib/chat-date-recovery.mjs validates schedule separately. Invalid model schedule output preserves the complete accepted schedule, validates the candidate's other fields, and returns a normal200 clarification turn. It never repairs or invents a date, year or time. A replacement reply prevents the model claiming an invalid date was saved. Optional Fable tickets are signed for the replacement reply.

Clarification chooses one missing fact from explicit calendar-context phrases, retained focused year/time question-answer pairs, or accepted schedule. It does not scan unrelated earlier user messages for arbitrary numbers or office hours. Focused year/time answers remain available across subsequent turns, preventing a clarification loop. It can conservatively ask again when natural language is ambiguous. Existing conversation keeps unresolved user words for Claude's following turn.

The Claude prompt and schema descriptions now forbid date-only values, relative phrases, placeholders and guessed year/time. Runtime remains authoritative. Invalid request drafts and invalid non-schedule provider fields still fail honestly. Provider credential, limit and connection failures are unchanged. No retries added.

## Files

- app/api/chat/route.js: provider boundary and prompt.
- lib/listing.mjs: exported parseSchedule; unchanged validation semantics.
- lib/chat-date-recovery.mjs: pure schedule recovery/clarification.
- lib/claude-ai.mjs: exact date field descriptions.
- tests/claude-ai-route.test.mjs: actual handler/provider fetch rehearsals.
- tests/setup.test.mjs: source-loader import migration.

## Evidence

Ran `node --test tests/claude-ai-route.test.mjs tests/claude-ai.test.mjs tests/listing.test.mjs tests/setup.test.mjs`:89 passed,0 failed.

The legacy confirmation statement is rehearsed against the actual route and intercepted Claude fetch: relative date output reproduces400 with exactly the screenshot error. The repaired actual route returns200, original accepted schedule, retained valid location/capacity/description and a single year question. Tests cover relative/date-only/impossible date/bad time, complete valid date, known calendar year, preserved accepted schedule, weekly schedule, invalid other fields, invalid request draft, optional speech, no extra calls, service401/429/500, unrelated quantities/office hours, focused year versus capacity answers, and a three-turn relative-date/year/time recovery sequence.

No paid calls, API secrets read, environment changes, deployment, or server process started by this agent. Physical microphone/audio quality is outside this server change. PM performs build/browser/deployment verification.

Skills read: .agents/skills/brief-to-site/SKILL.md; .agents/skills/workshop-owner-language/SKILL.md; pstack principle-fix-root-causes, principle-boundary-discipline, principle-prove-it-works. Read Next16 route handler guide. Shared rules and backend role read. Decisions needed: none.
