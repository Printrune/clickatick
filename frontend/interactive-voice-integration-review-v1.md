# Interactive voice integration review v1

2026-10-18. Frontend specialist. Brief v33. Reviewed `components/Workspace.jsx` against `lib/voice-conversation.mjs` and `contract/voice-conversation-v1.md`. No application source was changed during this review.

## Result

No blocking integration defect found by source inspection. The controller's 12 deterministic lifecycle tests passed again during review. Actual browser microphone and speaker behavior remains unverified by this specialist.

## Checked behavior

| Before | After | Why |
| --- | --- | --- |
| A voice action provided isolated input. | Explicit voice entry starts the controller with the latest assistant question. | The assistant asks first and the controller owns alternate speaking and listening phases. |
| Dictated input required a manual send. | `onAnswer` calls the existing `send` function with recognized final text and returns its reply. | A successful final answer advances to the next spoken question. |
| Audio and recognition could compete. | The controller excludes recognition during speech and network waiting, with a timed echo guard. | The microphone cannot submit the spoken question as an answer. |
| Media lifecycle was spread across controls. | Close and typing call `stop`; review and page hiding call `pause`; unmount calls `dispose`. | Every exit invalidates callbacks and stops media resources. |

The transcript updates the existing input. Empty transcript notifications do not erase the preserved input. The active voice textarea is read-only and the send action is disabled, so a partial answer cannot be submitted while recognition is active. Pause enables deliberate editing or switching to typing.

The request ref and mounted ref guard the result of `send`. Unmount aborts the pending request, and request identity prevents a different request from receiving the old result. `busyRef` blocks duplicate submissions before React commits a busy-state render. The controller also guards duplicate recognition and stale promise callbacks independently.

Pause, close, and switching to typing intentionally allow an already submitted answer to finish updating the draft and chat. This is the PM's clarified integration behavior. The controller generation guard prevents that reply from resuming speech or recognition. Resume is disabled while the accepted answer is pending, and a later explicit resume selects the latest assistant reply.

Visibility changes pause only an active voice run. Returning to the page does not resume it. Review mode likewise requires deliberate resume after returning to conversation. Voice unsupported states disable voice entry and explain the typing alternative.

## Evidence and limits

Reviewed Workspace state ownership, voice entry and restart, send rejection and cleanup, review and close controls, visibility listener, unmount cleanup, composer controls, and speech-reading interaction. Ran `node --test tests/voice-conversation.test.mjs`: 12 passed, zero failures.

The PM reports browser-fixture evidence for two automatically submitted turns, pause/resume, empty speech, and typing focus. That evidence uses injected speech boundaries. It does not establish that a physical microphone, browser speech-recognition service or actual speaker playback works on every device.

Previously loaded role and skills remain applicable: frontend role, shared rules, frontend-design, Emil design engineering, animation performance, owner language, and unslop. No owner decision is needed.
