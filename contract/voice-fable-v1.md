# Fable voice contract v1 (proposed)

Brief: brief/project.json v56. Date: 2026-10-18. PM approved this contract before implementation with an explicit activation flag and 3000-character reply bound. Frontend read and agreed before implementation.

## Capability and messages

`connections()` adds optional `speech:{enabled:true,voice:'fable',greeting:{text,ticket},resume:{text,ticket}}` only when FABLE_SPEECH_ENABLED=true, AI_ENABLED=true, ANTHROPIC_BUDGET_CONFIRMED=true and a valid server OPENAI_API_KEY exists. Existing deployments without the key retain their original connections shape. This configuration is readiness, not verified paid service success.

Fixed greeting: `Hi! What event or activity would you like to create tickets for?`
Fixed resume: `What would you like to add or change about your tickets?`

Successful /api/chat adds optional `speech:{ticket}` for the validated assistant reply. Client speaks that reply with its ticket. No key or provider configuration reaches the browser.

For a stale initial ticket, POST /api/speech with `{action:'prompts'}` refreshes only those fixed greeting/resume tickets, with no paid call. It cannot mint arbitrary text tickets.

## Streaming endpoint

POST /api/speech JSON `{ticket:string}`. Same-origin mandatory. Only a short-lived HMAC-signed ticket from server-generated fixed prompts or validated Claude replies is accepted. The ticket contains signed text, expiration, nonce and purpose; it is not encrypted. It expires after 5 minutes. Verification rejects tampering, oversized text and expiration. No arbitrary client text/voice/model fields accepted.

Success 200: raw PCM bytes, 24000 Hz, signed 16-bit little-endian mono. `Content-Type: audio/pcm`, `X-Audio-Sample-Rate:24000`, `Cache-Control:no-store`, `X-Content-Type-Options:nosniff`. Browser streams and schedules audio as data arrives. Its adapter exposes speak({text,ticket,onStart,onEnd,onError}) returning cancel; onStart means actual scheduled audio begins, not request creation. Cancellation aborts request and stops playback. No random sentence-by-sentence TTS calls.

Failure JSON `{error:string,code:string}` with status 400 invalid, 403 origin/ticket, 409 replay, 413 size, 429 throttled, 503 unconfigured/upstreamcredentials/credits, 502 provider/network. No upstream text or key logging. After streaming headers, failure terminates stream and client displays a recoverable audio error. No automatic retry or automatic paid fallback.

Limits: 3000 speech characters; 16000 request bytes; 5-minute ticket; 30 starts/minute and 2 concurrent streams per process; one start per token per process; 45-second total upstream deadline and bounded audio bytes. These ephemeral checks are not a hard global budget or distributed replay prevention. Provider/account spend controls remain required for the existing total USD10 demo allowance. No paid test in this task.

## Provider

POST https://api.openai.com/v1/audio/speech with model gpt-4o-mini-tts-2025-12-15, voice fable, response_format pcm, stream_format audio. Natural, warm, concise conversational delivery instructions, normal sentence flow without theatrical pauses. Claude remains the conversation model. Server fetch uses private key, no-store, redirect error and cancellation.

Official references read: https://developers.openai.com/api/docs/guides/text-to-speech and https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create . The guide requires clear AI voice disclosure. Frontend includes it.

https://developers.openai.com/api/docs/deprecations lists this TTS model retirement on January 6, 2027. This implementation does not silently substitute a different voice/model. Migration needs separate review.

## Ownership and verification

Backend: lib/speech-server.mjs, app/api/speech/route.js, lib/services.js, chat route token addition, focused unit/route tests and backend/voice-fable-v1.md. Frontend: playback/controller/UI. Test provider with intercepted fetch only; prove first chunk streaming, cancellation, invalid signature/expiry/replay, size/origin/rate limits and no-key gating. Live voice quality awaits key and permitted verification.


