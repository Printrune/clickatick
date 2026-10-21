# Immediate voice controller v2

2026-10-18. Frontend specialist. Read brief v36 and agreed `contract/voice-conversation-v2.md` before implementation. Retained approved design, Claude provider, existing listing schema and USD10 total allowance.

## Changes

Start and Resume call recognition.start synchronously from the user action. They no longer create an introductory spoken question or wait for speech completion. The question remains visible through the PM's Workspace integration.

Recognition uses continuous results. Final words start a 1000 ms silence boundary. More results reset it. An unfinished interim phrase cancels the boundary until that phrase becomes final, so unfinished words do not trigger submission. The boundary calls recognition.stop once, and the resulting end callback submits final text once. Listening has a 60 second upper bound. Natural browser end still handles final answers or pauses empty input safely.

Subsequent assistant replies retain spoken playback followed by the echo guard and automatic listening. `interrupt()` during speaking cancels playback and timers, invalidates old callbacks, then starts recognition synchronously within the same bounded run. It does not reset the accepted-answer count. There is no microphone capture during playback and no acoustic full-duplex behavior.

Recognition onstart confirms readiness with "Listening. Start talking." Before that event, the status explains microphone permission if requested. Cleanup and natural end clear the onstart handler, and captured stale handlers cannot revive a run.

## Evidence

`node --test tests/voice-conversation.test.mjs` passed 14 deterministic tests. Test boundaries prove microphone startup before any utterance, no introductory onend dependency, silence stopping exactly once, two automatic turns, interim silence reset, interrupt cancellation, stale callbacks, pause/stop/dispose cleanup, 60 second timeout, audio and permission errors, agent failure, and bounded runs.

Only `lib/voice-conversation.mjs` and its tests changed, besides this report. No actual microphone, speaker, external request, paid service or deployment was used. The PM owns rendered browser verification and deployment.

## Instructions and limits

Previously read frontend role, shared rules, frontend-design, Emil design engineering, animation performance, owner language and unslop remain applicable. No visual exploration, package change or interface to the server changed. The new `silenceDelayMs` option permits deterministic tests and defaults to 1000 ms. Physical device audio still requires validation. No owner decision is needed.
