# Conversation reliability frontend v1

Brief: `brief/project.json` v58. Contract: `contract/conversation-patches-v1.md`, agreed amendment. Date: 2026-10-18.

## Implementation

Workspace now keeps validated `conversationState` beside the accepted draft and messages. It sends this state with each request, persists it across reloads, and clears it when the user starts new tickets. `chatPayload` includes the state in its 23,000-byte UTF8 budget, preserving unresolved facts while removing older complete chat turns. The browser-safe state parser is owned by Backend.

Successful replies update the illustration only when the parsed accepted draft actually changes. `lib/chat-client.mjs` derives the checked note from changed accepted scene facts. A mixed answer cannot display rejected raw words as saved. Clarification-only replies still speak and return to listening, without a false accepted-answer note. Reload restores explicit scene progress rather than treating every old user message as an accepted fact. Legacy drafts remain usable with no inferred checked note.

Explicit manual edits remove only pending facts for the corresponding field or interdependent group. Inventory edits resolve ticket type/price/capacity facts; schedule/type/timezone edits resolve the schedule group. Address/same-location and referral settings resolve their relevant groups. Other pending facts remain. The existing draft, local photos, precise pins and disclaimer review behavior remain handled by the established listing/setup logic.

Real request failures retain the accepted draft, conversation state and failed answer. A visible Retry saved answer button initiates exactly one new request after a user click. Voice retries use a controller entry point that goes straight to thinking, without opening a microphone while waiting. The saved answer also survives reload. A user can discard it, replace it by typing, or continue the conversation. There is no automatic paid retry, repair request or model fallback.

## Source and tests

Frontend owns changes in `components/Workspace.jsx`, `lib/chat-client.mjs`, `lib/chat-context.mjs`, `lib/voice-conversation.mjs`, client/controller tests and the labelled voice fixture.

`node --test tests/chat-client.test.mjs tests/speech-client.test.mjs tests/voice-conversation.test.mjs`: 36 passed, zero failed. Tests cover actual accepted-value feedback, no-change clarification, invalid response protection, explicit progress restoration, pending facts outside trimmed history, UTF8 limits, manual correction isolation, retry from a failed turn, and retry after reload with voice initially off. Existing speech streaming and recognition lifecycle checks also pass.

## PM browser verification

The existing fixture installer supports `/dev-voice-check?start=1&scenario=reliability`. It is explicitly labelled simulated audio and AI. It mounts the real Workspace/controller, with these controlled steps:

1. Start voice chat, finish the simulated opening, and answer with the Halloween tour.
2. Finish the next question and answer with `50 guests and tickets cost bananas`.
3. Confirm the spoken question asks the price, capacity is 50, price remains empty, and the checked scene note contains accepted capacity only.
4. Finish that reply and confirm automatic listening. Correct the price with the supplied next answer, `25 dollars`.
5. The Simulate service failure button makes the next supplied answer return an explicit HTTP503. Confirm no automatic request follows. Click Retry saved answer and confirm a single reply is spoken before listening returns.
6. Reload while an unresolved fact or failed answer exists. Confirm accepted draft and appropriate pending/retry state remain. Use manual setup to correct the pending field and confirm unrelated pending facts remain.

The toolbar mocks expected chat envelopes; it does not claim to prove real Claude interpretation. Backend tests cover the actual route and provider boundary separately. PM owns browser evidence, the complete suite/build and release. Remove the installed development route before the production build with `node scripts/voice-browser-fixture.mjs`.

## Limits

No preview process, deployment, secret read, physical microphone session or paid AI request was performed by Frontend. Physical playback quality and actual model interpretation remain PM verification tasks. This implements resilient application behavior; it does not claim that an AI model can never misunderstand an answer.

Read brief v58, shared rules, Frontend role, starter instructions, actual relevant frontend/copy/brief skills, root-cause and verification principles, architecture/source-flow skills, unslop and bundled Next.js client component guidance. The selected visual direction, branding, licences and existing features are preserved.
