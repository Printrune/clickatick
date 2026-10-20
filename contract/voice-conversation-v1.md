# Interactive voice conversation v1

Brief v33, 2026-10-18. Agreed before implementation. Retain the existing POST /api/chat request/response and canonical listing schemas. Voice is a frontend interaction around the same Claude conversation and scene updates.

## Conversation loop

Deliberately entering voice mode speaks the current unanswered assistant question, or the initial ticket question. Recognition starts only after speech finishes and a short echo guard. A final recognized answer sends automatically once recognition ends. Interim/empty input never submits. The existing chat endpoint returns a short next question; the controller speaks it and listens again. There is no microphone capture during agent speech or network waiting. Show transcript and phase in the bubble. The agent asks one useful missing-detail question at a time and accepts multiple facts in an answer. Once details are complete, it offers review or edits without repeating intake.

Pause, typing, review, close, hidden page, permissions failure, no speech, network failure and unmount stop recognition/speech/timers. No automatic error retries or empty-answer loops. Bound each listening attempt and voice run. Further user interaction can explicitly resume. A visible Pause/Resume/Switch to typing control always remains available. Preserve partial transcript on pause/failure. Unsupported browsers offer typing with an honest explanation. No new provider, paid audio service, background listening, secret exposure or budget increase.

## Controller interface

`lib/voice-conversation.mjs` exports `createVoiceConversation({createRecognition, synthesis, createUtterance, onState, onTranscript, onAnswer, maxTurns, listenTimeoutMs, speechTimeoutMs, echoDelayMs})`.

- `onState({mode,phase,message,turns})`: mode `off|active|paused`; phase `idle|speaking|listening|thinking|paused`. `onTranscript(text)` displays interim/final recognized words. `onAnswer(finalText)` returns a Promise resolving the accepted assistant reply string; rejection pauses safely. The frontend owns network/draft updates.
- Methods `start(question)`, `pause(message?)`, `resume(question?)`, `stop()`, `dispose()`. `stop()` cancels resources and returns off/idle for typing or close. Cancellation/generation guards reject stale speech/recognition/network callbacks. `resume` is deliberate user interaction, with a retained current question when omitted. Make the run cap explicit in status when reached; do not fabricate a cost cap.
- Injectable browser boundaries enable meaningful deterministic lifecycle tests. Test speaking→listening→one final answer→network→spoken next question, echo prevention, interim/no-speech cases, duplicate/stale callbacks, pause/hidden/unmount cleanup, permission/provider failures and bounded runs.

## Ownership

- Voice frontend specialist: lib/voice-conversation.mjs and tests/voice-conversation.test.mjs only. Output frontend/interactive-voice-v1.md.
- Backend specialist: app/api/chat/route.js prompt-only refinements and relevant tests/review. Agree unchanged schema before coding. Output backend/interactive-voice-review-v1.md.
- PM: Workspace integration, UI labels/status, pause/review/visibility behavior, browser verification, brief and deployment.
- Designer: concise voice interaction/state copy and rendered review artifacts. Preserve the existing bubble direction.

The existing USD10 total AI allowance remains. Test the controller deterministically without live calls first. Do not claim real microphone/audio success without actual evidence. Existing device permission gates remain under browser control.

## Accepted pause behavior

An answer already submitted to the server may finish saving to the visible draft and conversation after Pause, review, close, or switching to typing. It never restarts audio or microphone capture. Unmount aborts the request and rejects its UI updates. New-draft reset remains disabled during an active request.
