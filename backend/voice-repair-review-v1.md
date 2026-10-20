# Voice repair integration review v1

Date: 2026-10-18. Brief: `brief/project.json` v56. Role: independent backend/frontend integration reviewer.

Reviewed the implementation against `contract/voice-fable-v1.md`. The review made no implementation changes. Frontend and backend owners applied the findings below while this review was in progress.

## Result

No remaining blocking finding in the inspected integration. The production release must keep Fable disabled without the separate OpenAI credential and activation flag. Claude remains the conversation provider. This review did not make a paid request, use a microphone, start a server, or test physical audio quality.

## Findings resolved during review

1. Hidden-page recovery originally replayed the same one-use Fable ticket after cancelling playback. The server would reject that replay and pause the conversation. The controller now returns to listening after interrupted playback. A reply completed during a hidden thinking phase is still spoken on return.
2. A slow downstream reader could retain a speech concurrency slot after the deadline. The server now releases the slot, cancels the upstream reader and errors the downstream controller on abort, including while a chunk is queued. The new backpressure deadline test passed.
3. The PCM player treated delayed network EOF as an empty response when all audio buffers had already finished. It now completes successfully when bytes were received and no sources remain. A genuinely empty stream still fails.

PM separately identified transcript duplication and hidden partial-transcript loss. The current controller retains captured text across restart, pause and visibility suspension; its regression tests passed.

## Inspected behavior

- `components/Workspace.jsx` creates a shared player, supplies signed tickets only for Fable, uses browser speech when Fable is unconfigured, and labels that distinction in the interface.
- Native opening speech starts from the voice button action. Listening begins after playback and a short echo delay. Talk now cancels playback and starts recognition. Manual resume listens without replaying an expired or used ticket.
- Voice disposal, manual stop and pause invalidate old callbacks. Recognition handlers are detached before abort. Hidden-page recovery resumes only the controller's own suspension.
- Recognition handles empty end and no-speech by rearming, retains interim words across browser restarts and retries network errors three times. Permission errors pause without repeated prompts. There is no default twelve-turn limit.
- `lib/chat-context.mjs` carries the complete listing and a recent conversation window. It removes whole old turns until the serialized UTF-8 body is at most 23,000 bytes. The server remains bounded at 24,000 bytes and 30 messages.
- Spoken answers longer than 3,000 characters remain in the input with an explicit error. Workspace no longer truncates the transcript before the user can edit it.
- `lib/speech-client.mjs` handles odd chunk boundaries, decodes signed little-endian PCM, schedules mono 24 kHz buffers, cancels requests and active sources, and does not silently retry a paid request or switch provider after a Fable error.
- `lib/speech-server.mjs` requires every activation gate, validates same-origin requests, accepts only signed short-lived server text, limits request/audio sizes and rejects replay per process. It returns fixed errors rather than provider details. MIME and final PCM byte alignment are checked.
- No OpenAI key or provider secret is serialized into client props. With Fable disabled or no key, the speech endpoint returns an unconfigured response before reading or sending a paid provider request.

## Evidence

Ran `node --test tests/voice-conversation.test.mjs tests/speech-server.test.mjs` against the inspected files. All 28 tests passed. This includes 15 controller checks and 13 speech server checks, including the backpressure regression. Tests use injected recognition, synthesis and intercepted provider fetches.

Inspected source: `components/Workspace.jsx`, `lib/voice-conversation.mjs`, `lib/speech-client.mjs`, `lib/speech-server.mjs`, `lib/chat-context.mjs`, `lib/services.js`, `app/api/chat/route.js`, `app/api/speech/route.js` and their available tests.

Instructions and skills read: `team/roles/backend.md`, `team/shared-rules-v1.md`, `.agents/skills/brief-to-site/SKILL.md`, and the installed `principle-prove-it-works` and `unslop` skill files. The role's referenced root `CLAUDE.md` is absent; the preserved shared rules are available at `team/shared-rules-v1.md`.

## Remaining verification limits

The PM's full build and browser fixture are separate release checks. Client PCM tests were still being added when this review finished. Real microphone behavior, device speech quality, browser audio permissions and real Fable output need separate testing. Fable remains unavailable with only a Claude API key. Process-local throttles are not a distributed spending cap, as the contract states.

No owner decision is needed for the no-key browser-voice repair. Enabling Fable requires the separate credential and explicit activation within the approved budget.
