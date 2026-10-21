# Interactive voice controller v1

2026-10-18. Frontend specialist. Brief `brief/project.json` version 33. Contract `contract/voice-conversation-v1.md` agreed before implementation. The PM requested and agreed an additional `stop()` method during implementation.

## Implemented

`lib/voice-conversation.mjs` exports the injected `createVoiceConversation` controller. It speaks the current question, waits for audio completion and a 350 ms echo guard, listens, submits a final answer once recognition ends, waits for the answer promise, then speaks the returned question. Listening is disabled during audio and network waiting.

Interim text updates the visible transcript but never submits. Pausing preserves the last transcript, cancels recognition, audio and timers, and invalidates captured callbacks. Stop returns the UI to off/idle. Dispose permanently invalidates the controller. Start or resume requires deliberate UI interaction. The latest question is retained for resume.

Defaults are 12 submitted answers per active run, 20 seconds per listening attempt, and 45 seconds per spoken question. Reaching the answer limit pauses and requires explicit resume. This is a turn limit, not a dollar spending cap. Permission, microphone, recognition-network, speech, empty-answer and agent-response failures pause without retry.

## Interface notes

The contract callbacks and methods are implemented. `stop()` was added by agreement with the PM. An optional `timers` argument provides deterministic tests and defaults to `globalThis`.

`onAnswer` returns the accepted reply string. Late resolution cannot restart the controller after pause. The Workspace must also guard its own pending network response before mutating draft or message state. The controller cannot reverse side effects inside an injected callback.

## Evidence

`node --test tests/voice-conversation.test.mjs` passes 12 tests. The fake clock and injected browser boundaries require no microphone, paid service or actual browser audio.

Coverage includes two full turns, echo prevention, duplicate final/end callbacks, stale callbacks, pause during an in-flight response, partial transcript preservation, empty/interim-only input, listening and speech timeouts, blocked audio, microphone permission and recognition-network errors, agent failure, turn limit, explicit resume, unsupported APIs, stop and dispose cleanup.

## Instructions read

Read brief v33, frontend role, shared workshop rules, starter AGENTS.md, README, and the voice contract. Relevant loaded skill sources were `.agents/skills/frontend-design/SKILL.md`, `.agents/skills/emil-design-eng/SKILL.md`, `.agents/skills/animation-performance/SKILL.md`, `.agents/skills/workshop-owner-language/SKILL.md`, and the installed `pstack-plugin/0.2.0/skills/unslop/SKILL.md`. Read bundled Next.js `use-client.md` for browser boundary guidance. This file adds no React or animation implementation.

## Gaps and decisions

PM owns Workspace integration, rendered status, review/visibility hooks, actual device validation and deployment. No browser audio, microphone capture, backend request or deployment was performed by this specialist. No owner decision is needed.
