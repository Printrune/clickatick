# Voice repair verification v1

Brief v56. User story: choose voice, hear the assistant's question promptly, answer naturally, receive the next spoken question, and continue through ordinary browser recognition restarts.

## Baseline findings

- Existing controller intentionally started recognition without speaking the initial question.
- Empty recognition end and no-speech both paused the conversation rather than reopening listening.
- A fixed 60-second listening timer and default 12-answer limit also caused automatic pauses.
- Visibility change paused the controller with no matching automatic foreground recovery.
- Workspace sent unbounded conversation history while the API accepts at most 30 messages; long sessions could fail even with a complete draft.
- Browser speechSynthesis used its default voice. It was not Fable.
- Vercel environment names inspected without decryption: Anthropic configured; OPENAI_API_KEY absent. Owner replied that they have the Claude API. PM explained separate credentials are required for Fable.

## Scope and boundaries

Fix controller lifecycle and conversation history. Prepare optional OpenAI Fable streaming speech while retaining Claude for answers. Fable remains disabled without separate key and explicit activation flag. No paid API request is authorized by this verification record or performed by the tests.

Backend/Frontend agreed contract/voice-fable-v1.md before speech API implementation. Official Fable support and PCM streaming verified in https://developers.openai.com/api/docs/guides/text-to-speech. The chosen TTS model retires January 6, 2027 per https://developers.openai.com/api/docs/deprecations; migration remains an activation consideration.

## Verified locally

- All 153 automated tests passed, including recognition restart, transcript preservation, visibility return, late final results, speech cancellation, streaming PCM, signed speech tickets, and long chat payload handling.
- Brief contract check, backend mocked verification and 45 actual local PostgreSQL event-system checks passed.
- Production build passed. Development voice fixture was removed before build and the source manifest guard passed (57 files).
- Labelled browser fixture used the real Workspace and voice controller with simulated recognition, speech and assistant replies. Start spoke the opening question; two answers submitted automatically and produced follow-up questions; completed speech returned to listening. No-speech, empty recognition end and a temporary network interruption recovered. Manual pause stayed paused and Resume opened listening.
- A deliberately unfinished simulated question reached its speech deadline while verification was interrupted; this correctly showed an actionable pause rather than a false success.
- Mobile review at 390 x 844 kept the scene, question, transcript and voice controls visible. Viewport override was reset.
- Evidence: ../../../../../clickatick-voice-repair-desktop.jpg and ../../../../../clickatick-voice-repair-mobile.jpg. These are simulated-audio fixture screenshots, not proof of physical microphone or Fable output.

No paid AI requests were made. Actual physical microphone behavior and voice quality remain unverified. Fable remains disabled: the owner has a Claude API account, and no OpenAI key or activation flag was added.

## Deployment

Production deployment dpl_HTUG21BJYiHkzt94FLZdx7GUwtap is READY and assigned to https://ticketnest-psi.vercel.app/. Fresh production browser verified the speech-first entry copy and the explicit Browser voice / Fable not connected fallback. Existing saved draft remained intact. No microphone activation or paid request was used for the live check. Live screenshot: ../../../../../clickatick-voice-repair-live.jpg. Completion recorded in brief v57.
