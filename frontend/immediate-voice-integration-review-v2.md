# Immediate voice integration review v2

2026-10-18. Frontend specialist. Brief v36 and contract `voice-conversation-v2.md`. Reviewed `components/Workspace.jsx` and `app/bubble.css`; made no application code changes.

## Result

No blocking defect found by source review. Start voice chat and Resume call `voiceConversation.start` synchronously from the button handler. There is no await, effect, animation completion or introductory utterance between the deliberate user gesture and recognition startup.

Talk now calls `interrupt()` directly while the controller is speaking. The controller cancels speech and pending timers, invalidates stale callbacks and starts listening without resetting its turn count. Subsequent accepted responses still pass through the existing request, draft and scene update flow before speech playback.

## Interface and lifecycle checks

| Before | After | Why |
| --- | --- | --- |
| Entry waited for an introductory question to finish playing. | Entry starts microphone recognition immediately and displays the current question. | The user can begin answering after permission and recognition readiness. |
| A text composer remained the main voice interface. | A dedicated voice panel shows phase, question, transcript and actions. | The automatic conversation does not imply a manual Send step. |
| Spoken responses required waiting. | Talk now explicitly interrupts playback and starts listening. | The user can take the turn without acoustic full-duplex capture. |
| Listening could appear active while permission was pending. | The initial message explains permission and the onstart message confirms readiness. | The interface distinguishes startup from a started recognizer. |

The voice panel hides the text composer and chat log while preserving their state. Switching to typing stops voice and focuses the restored composer. Pause remains enabled during an active request. Resume waits for the accepted request to finish, and then starts with the latest assistant question. An already submitted request may finish updating the draft after pause or close, as documented in the contract; its reply cannot restart media.

Page hiding pauses the active controller without automatic resume. Review pauses voice. Close and typing stop it. Unmount disposes the controller, aborts the request and rejects stale UI updates through mounted/request identity guards. Pending microphone result callbacks and speech callbacks have independent generation and per-turn guards in the controller.

The dedicated panel keeps bounded scrolling through the composer container. Actions have a minimum 44 px height. Motion is state based and uses transforms or opacity. The reduced-motion rule disables the voice indicator animations. Existing scene and draft interfaces are unchanged.

## Evidence limits

The controller's 14 deterministic tests passed in this implementation turn. The PM reports browser-fixture checks for immediate first recognition before TTS, two automatic silence-ended answers, Talk now, automatic listening after playback, Pause/Resume and typing focus. These simulated browser boundaries do not prove actual microphone, speech-service or physical speaker behavior. No live service, device capture, build or deployment was performed by this reviewer.

Previously loaded frontend role and relevant actual skills remain applicable. No additional owner decision is needed.
