# Interactive voice verification v1

Brief: project.json version33. Contract: contract/voice-conversation-v1.md, agreed before integration.

## Implementation

Workspace connects the browser speech boundaries to the deterministic voice controller. Explicit Talk entry speaks the latest unanswered assistant question. Listening begins only after speech ends plus an echo delay. Final recognition sends exactly once after recognition ends. The existing chat endpoint updates the draft and scene, then its next question is spoken. Pause/Resume and Switch to typing remain inside the bubble. Text-only replies may still use the existing optional read-aloud control.

Review, close, hidden pages and unmount stop active voice capture and speech. An already-submitted answer can finish saving to chat/draft after pause but never resumes the voice loop. Unmount aborts its request. Reset is disabled during submission. Twelve answers per explicit run, a20-second listening timeout and45-second speech timeout prevent unattended loops. No automatic retry or new paid audio provider.

## Verified

- All112 Node tests passed, including12 controller tests, route validation, avatar and scene tests, and real local database restart checks.
- Required45 PostgreSQL import checks and isolated backend adapter checks passed.
- Final production build passed with the temporary test route removed.
- Actual Workspace browser fixture completed two spoken turns. Each finalized answer made one simulated chat request, updated the scene, and spoke the next question. Submission count2.
- Explicit Pause stopped speech. Resume spoke the current question. Ending without an answer paused without another submission. Switch to typing removed voice controls and focused the composer.
-390x844 phone review: latest question retained98.7px transcript area, voice panel109.75px, composer ends810.2px within bubble bottom836px. Dark panel contrast corrected and duplicate Pause control removed.
- Designer source and rendered review passed for supplied phone state. See design/interactive-voice-review-v2.md.
- Fixture code is preserved in frontend/fixtures/voice/page.jsx.txt; install/remove with node scripts/voice-browser-fixture.mjs --install / node scripts/voice-browser-fixture.mjs. Deployment manifest refuses the installed fixture route.

## Limits

The fixture simulated speech and chat boundaries. Physical microphone, actual browser audio playback, browser speech-service network quality and physical mobile keyboard were not verified. No real provider request or additional AI spend was made this turn. Hosted login/persistence/publishing remain outside this update. Existing Claude connection and camera behavior preserved.

## Release

Production deployment dpl_FV4ETdCf9FGHo9N8PjDKSkyDXNFp. READY with alias ticketnest-psi.vercel.app. Live browser verified Talk entry, contextual edit question, immediate Pause, Resume/Switch controls and desktop layout. Paused before microphone capture; no physical audio success claimed. Screenshot: ticketnest-live-voice.jpg in workspace root. Task-owned preview stopped and fixture tab closed.
