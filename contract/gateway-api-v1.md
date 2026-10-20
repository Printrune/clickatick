# Gateway chat contract v1

Agreed with Product Manager before implementation, brief v18, 2026-10-18. Existing frontend request and response stay unchanged.

- POST /api/chat accepts same-origin JSON `{messages,draft}`, at most 24000 UTF-8 bytes, 30 messages of 3000 characters. Roles are user and assistant. Draft parsed by existing listing boundary.
- Success returns `{reply,draft}`. Reply is bounded and returned draft is parsed. No publication, account or ticket issuance action.
- AI requires AI_ENABLED=true, AI_FREE_TIER_CONFIRMED=true and server VERCEL_OIDC_TOKEN or AI_GATEWAY_API_KEY. Defaults disabled. The attestation means the owner verified free credits and no purchased credits or automatic top-up. A credit balance alone does not prove this.
- Only https://ai-gateway.vercel.sh/v1 is used. No provider keys, alternate endpoints, fallback model, retries, paid reporting or BYOK. Pin openai/gpt-4.1-mini, live catalog confirms JSON output and $0.40/M input, $1.60/M output on 2026-10-18. Free-tier eligibility is subject to actual account request verification, not established by catalog listing alone.
- Read GET /v1/credits before each completion. Non-positive or unreadable balance stops model requests. Gateway 402 stops on exhausted allowance, 429 asks to wait, 401/403 asks owner to resolve connection or free-credit verification. Never prompt to buy credits.
- Completion uses 1800 maximum output tokens. Input and output bounded. Secrets and raw gateway errors never returned. Error status 400 validation, 413 body, 503 configuration, 402 credits, 429 throttling, 502 upstream failure.
- Supabase reservation is removed from the Gateway-only chat path. Hosted publishing and local disk services retain their current behavior. There is no persistent distributed app rate limiter in this revision. Provider free-tier limits apply, but protected deployment must remain enabled pending public abuse controls. Balance checks are not atomic reservations or a hard app spend cap.
- Owner confirmed free credits and disabled top-ups through PM; PM owns activation, deployment and live verification.

Sources: https://vercel.com/docs/ai-gateway/sdks-and-apis/rest-api, https://vercel.com/docs/ai-gateway/rate-limits, https://ai-gateway.vercel.sh/v1/models.

Runtime amendment agreed with PM before fix: Vercel Function authentication is read per request from x-vercel-oidc-token, only on Vercel runtime. Home passes its server request header to connections; route passes request token to environment helper and adapter. Local client-supplied headers are ignored. No token is cached or assigned globally. Source https://vercel.com/docs/oidc.
