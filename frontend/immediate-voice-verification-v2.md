# Immediate voice verification v2

Brief36, contract/voice-conversation-v2.md agreed before implementation. User requested immediate speech after selecting voice, like a voice conversation.

## Changed

Start voice chat opens browser recognition synchronously from the click. It does not wait for introductory speech. Start/Resume are microphone-first. Current assistant question remains visible in a dedicated voice stage. Text composer, suggestions and read-aloud checkbox are hidden until Switch to typing. A one-second silence boundary after finalized recognition stops the capture and sends once; browser end is also accepted. After the Claude answer, browser speech plays the reply and listening resumes automatically. Talk now explicitly stops playback and immediately opens the microphone, retaining the run limit.

This uses browser recognition and speech around the existing Claude text endpoint. It is not a native realtime audio or acoustic full-duplex implementation. Talk now provides explicit interruption. No provider/credential/budget changes.

## Browser evidence

Clearly labelled development fixture uses actual Workspace/controller with simulated recognition, speech and chat boundaries. First click showed microphone opened immediately with0 submissions and no opening utterance. Two answers automatically submitted after silence without Finish controls. Each updated scene and spoke a follow-up. Talk now interrupted playback and opened recognition immediately. A completed reply returned to listening. Pause/Resume, typing fallback and focus passed. No physical microphone access or real AI request was used.

Phone390x844: voice stage fits; controls756.45–802.2 within bubble bottom836. Text question stays visible. Final screenshot clickatick-immediate-voice-mobile.jpg in workspace root shows the simulated listening stage with a small fixture label. Test toolbar was reduced after it obstructed an initial control check; checks then passed. Designer review: design/immediate-voice-review-v2.md. Temporary route removed and task-owned preview stopped before deployment.

## Automated checks and release

14 controller tests and chat-route test passed. All114 tests,45 actual PostgreSQL import checks and isolated backend checks passed. Final production build passed with fixture routes removed. Integration review found no blocker. Production deployment dpl_HkM3v853nnVrrD6ZSTZL3NBqsFqy submitted; live readiness pending.

## Limits

Physical microphone, actual device audio playback, browser speech-service quality and physical mobile keyboard remain unverified. Native speech support varies by browser. Current authentication/persistence/publication limits and existing device-local avatar behavior remain unchanged.

Production READY with public alias. Live browser confirms Start voice chat entry and retained draft. Screenshot clickatick-immediate-voice-live.jpg. Physical microphone was not opened during live verification.
