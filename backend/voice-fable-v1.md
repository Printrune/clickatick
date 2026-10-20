# Fable speech backend v1

Brief read: brief/project.json v56. Contract: contract/voice-fable-v1.md. PM approved explicit activation gate and3000-character bound; Frontend read and agreed before implementation.

## Implemented

- lib/speech-server.mjs issues5-minute HMAC tickets for fixed greeting/resume prompts and validated Claude replies. Browser-provided text cannot mint a speech ticket.
- app/api/speech/route.js streams24kHz mono signed16-bit little-endian PCM from the requested Fable voice. One continuous utterance per reply; no sentence fragmentation.
- Capability appears only when FABLE_SPEECH_ENABLED=true, AI_ENABLED=true, ANTHROPIC_BUDGET_CONFIRMED=true and a syntactically valid server OPENAI_API_KEY exist. None was set or activated in this task.
- services.js adds optional speech capability, with signed fixed prompts. Chat route adds optional speech ticket after reply and draft validation. Existing Claude conversation remains unchanged except natural concise wording now permits contractions.
- Same-origin guard,16000-byte body bound,3000-character speech bound, signature/expiration validation,30 starts per minute,2 concurrent streams and one request per token within a process.
-45-second total upstream deadline and2160000-byte output bound. Cancellation and deadline abort upstream, discard queued downstream data and release the concurrency slot, including under backpressure.
- Fixed prompt refresh is free and cannot accept custom text. Provider errors are fixed, safe messages. No provider body, key or spoken text is logged. No automatic retry or paid fallback.

## Verification

node --test tests/speech-server.test.mjs tests/claude-ai-route.test.mjs tests/setup.test.mjs

28 passed,0 failed. Tests use intercepted fetch only. Evidence includes initial-chunk streaming before completion, signed Claude reply ticket issuance, invalid/expired/tampered tickets, activation gates, same-origin rejection, body size, private error handling, cancellation, deadline under unread queued data, byte limits, replay/rate/concurrency bounds and setup preservation.

node backend/verify-v2.mjs

Passed existing isolated activation/publication/origin/session/validation checks. Its import fixture and existing chat test fixtures were updated for new server helper imports.

## Limits

No paid OpenAI request, actual Fable audio quality or live provider account access was tested. User currently has Claude only. Fable remains off until a separate OpenAI key and explicit activation are authorized. Existing browser speech remains Frontend fallback; it must not be labelled Fable.

Controls are process-local, not a durable global budget or distributed replay lock. Multiple deployment instances and cold starts reset these controls. Provider account spend controls are still needed for the existing USD10 total allowance. Signed tickets contain readable reply text; they do not contain credentials.

The model is pinned to gpt-4o-mini-tts-2025-12-15 with voice fable. Official deprecations list retirement on January6,2027. No silent voice/model substitution implemented.

## Sources and loaded guidance

Official OpenAI text-to-speech guide: https://developers.openai.com/api/docs/guides/text-to-speech
Official create-speech reference: https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create
Official deprecations: https://developers.openai.com/api/docs/deprecations

Loaded backend role/shared rules and earlier brief-to-site, owner language, unslop, boundary discipline and prove-it-works. Loaded actual OpenAI Docs skill and fetched official pages. Checked installed Next route handler documentation before implementation. No SDK or dependency added.
