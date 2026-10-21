# Date clarification frontend v1

Brief: `brief/project.json` v57. Date: 2026-10-18.

## Finding

The screenshot shows a successful voice transcription followed by the listing validator's `Check the individual dates.` error. `Workspace.send` rejects a non-success chat response, restores the spoken answer and earlier messages, and the controller pauses on that rejection. This is expected for a real service failure, but an incomplete date should receive a normal clarifying question.

The agreed `contract/date-recovery-v1.md` keeps the successful response envelope unchanged. A validated draft and clarification already pass through Workspace, speak normally, and return to listening. Production client/controller changes are unnecessary. The backend owns model schedule recovery. Invalid request drafts and real service failures remain explicit errors.

## Changes and checks

- Added two controller regressions in `tests/voice-conversation.test.mjs`. A successful response to `2 days before Halloween` speaks the year clarification, stays active, resumes listening, accepts `October 29, 2026`, and speaks the time question. An actual rejected request preserves the transcript, pauses explicitly, and never retries automatically.
- `node --test tests/voice-conversation.test.mjs`: 20 passed, zero failed.
- Extended `frontend/fixtures/voice/page.jsx.txt` with `scenario=date-recovery`. It uses the real Workspace/controller with clearly labelled simulated recognition, speech, and chat responses. It does not call a paid service or open the microphone.
- No production source, style, dependency, or provider settings changed by Frontend.

## Browser walkthrough for PM

Install with the existing `node scripts/voice-browser-fixture.mjs --install` and use the PM-recorded preview process. Open `/dev-voice-check?start=1&scenario=date-recovery` on a separate test origin so the owner's existing draft is unaffected.

Choose Start voice chat. Use Finish simulated question before each Answer simulated question. The supplied sequence is a Halloween tour in Downtown Phoenix, `2 days before Halloween`, `October 29, 2026`, and `7 PM`. The second reply asks the year while the toolbar still shows `saved date: none`. After the fourth answer the toolbar shows `2026-10-29T19:00`. Finish that spoken reply and confirm the voice interface returns to listening without Resume conversation.

The toolbar is an expected-response fixture, not proof that Claude returned the same result. Backend route tests separately verify the actual server boundary using mocked provider output. PM owns browser evidence, production build and release. Remove the installed development route with `node scripts/voice-browser-fixture.mjs` before building or deploying.

## Read evidence and limits

Read shared rules, frontend role, starter AGENTS/README, the current brief, the actual root-cause and prove-it-works skills, unslop, relevant bundled Next.js client component documentation, and existing design/copy instructions. Selected visual direction is preserved. No new visual exploration occurred.

Local shared skill SHA256 values:

- frontend-design: `D91970639E9F5C37682AC7AB60094D35F1C7C1F38D731BD56396563AEE10C1D3`
- brief-to-site: `DEFC7C7719D3647F8B52F1AA7F457916697B1FEBD650D67CFE2A27A21190FFAD`
- copy-editing: `2A072606D9D5662509EA6EF62C65719487DCB68876ACAB9286BDE4D1AF5C030F`
- workshop-owner-language: `0CA29D37177342EF48A1261181C5F518A779F1883E81A5239F6F72632C616A3A`

No physical microphone, playback quality, real Claude request or Fable request tested by this specialist. No server started, deployment made or secret read. Decisions needed: none.
