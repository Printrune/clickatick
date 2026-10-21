# Speech-first conversation and Fable-ready playback v1

Brief: brief/project.json v56. Contract: contract/voice-fable-v1.md, read and agreed with Backend before API integration. Explicit FABLE_SPEECH_ENABLED gate remains off; current live option uses browser speech. No paid service request was made by Frontend.

## Root causes and repair

| Before | After | Why |
| --- | --- | --- |
| Voice entry opened recognition without speaking | Initial question is spoken immediately through the chosen player, then recognition opens | User hears a question on choosing voice |
| Empty recognition end / no-speech paused the session | Recognition re-arms with a short bounded delay | Normal browser recognition lifecycle is not treated as a failure |
| Hard 60-second listening stop | Idle rollover resets whenever results arrive | Does not cut a continuing utterance at a fixed wall-clock limit |
| Default twelve-answer cap | No default turn cap | Long sessions continue |
| Visibility pause never resumed | Only visibility-caused suspension resumes automatically | Manual pause/stop remains respected |
| Loading treated as speech | Preparing and actual playback are separate states | Accurate feedback |
| Unlimited history exceeded server limits | Most recent complete turns fit <=20 messages and <=23KB UTF8 including full draft | Avoid accidental stops in long conversations |

## Client implementation

- lib/voice-conversation.mjs owns lifecycle, transcripts, async speech cancellation, recognition retries, visibility and stale-callback guards.
- lib/speech-client.mjs streams signed Fable PCM (24kHz signed16LE mono), handles odd chunk boundaries, schedules audio progressively, and resolves only after playback completes. Cancellation aborts fetch and stops sources. No automatic paid retry/fallback.
- Unconfigured player uses browser speech and selects an available natural/enhanced/neural English voice where available. Availability and sound quality depend on browser/OS. This is not Fable and the UI says so.
- AudioContext unlock occurs synchronously from the explicit voice or read-aloud choice. Configured fixed prompts refresh only after voice selection; no paid prefetch on page visit.
- Voice and Read replies aloud use the same player. Ticketed speech is never silently replaced with browser speech on an error.
- Returning after hidden-page speech cancellation listens instead of reusing a consumed speech ticket. A new reply completed while hidden is spoken on return.
- More than 3000 spoken characters fail clearly and remain in the composer; no silent submission truncation. Large drafts are not silently shortened.
- lib/chat-context.mjs bounds request context, preserving complete current draft and latest user message.
- Workspace UI reports preparing/listening/speaking correctly and includes voice-source disclosure. Pause, typing, close and unmount cancel work.

## Verification

26 focused tests passed: tests/voice-conversation.test.mjs and tests/speech-client.test.mjs. Includes greeting, actual playback state, normal restarts, partial and late-final preservation, bounded retries, 14+ answers, visibility/manual stop, PCM boundaries, first-chunk streaming, delayed EOF, cancellation, autoplay failure, browser voice choice, UTF8 bounds and oversized-draft recovery.

Browser fixture template frontend/fixtures/voice/page.jsx.txt now speaks the simulated greeting and exposes no-speech/network interruption controls. Fixture remains explicitly labelled, uses simulated audio and AI, and the existing install/remove script plus deployment guard remain unchanged. PM owns installation/browser verification, final build and any deployment.

No physical microphone, speaker, browser voice quality or real Fable latency was measured. Fable needs separately authorized credentials/activation and verification within the existing total USD10 allowance. Fixed prompt refresh adds one network round trip when configured; no latency guarantee is made.
