# Claude integration review v1

Read backend role, shared rules, brief v18, brief-to-site and unslop skills. PM approved the interface contract before implementation. Subsequent owner instructions supersede free-only AI: direct Claude, USD 10 maximum total testing.

Implemented direct Anthropic Messages transport in lib/claude-ai.mjs. app/api/chat/route.js and lib/services.js now use it. Removed gateway-ai.mjs and its obsolete tests after caller migration. No OIDC gateway fallback remains. No changes to browser reply/draft shape or publication behavior.

Verification: `node --test tests/claude-ai*.mjs` passed 15 tests. Every provider fetch is intercepted. Evidence includes disabled budget gate, exact direct endpoint, key placement, fixed model, output schema, bounded UTF-8 payload, no redirects/retries, invalid/refused/truncated responses, safe provider/network errors, origin rejection and unchanged route result shape. No real requests, credentials, spend or deployment performed by this specialist.

Model: claude-haiku-4-5-20251001. Official current docs list USD 1 input and USD 5 output per million tokens and structured output support. See contract sources. Maximum output 1800 tokens. App payload 40000 UTF-8 bytes maximum. These limits reduce per-request spend but do not enforce the USD 10 total.

Activation remains disabled until ANTHROPIC_BUDGET_CONFIRMED=true. This flag is an operator attestation, not a financial enforcement mechanism. Existing provider credits might exceed USD 10. A monthly spend limit resets and is not a total lifetime cap. No persistent hosted atomic usage ledger exists. A dedicated verified allowance at most USD 10 total with no refill, or an implemented durable budget ledger, is required before setting the flag. Do not enable merely because an API key exists.

Secure handoff: owner enters ANTHROPIC_API_KEY directly into Vercel TicketNest environment settings, server-only, never NEXT_PUBLIC_, never chat. Set AI_PROVIDER=anthropic, remove stale AI_MODEL override or use pinned model above. Leave AI_ENABLED=false and ANTHROPIC_BUDGET_CONFIRMED=false until budget control verified. Redeploy after configuration changes. Remove old gateway runtime variables separately if present. Do not read or print secret values.

Remaining: PM build/deployment check, key configuration, enforceable total allowance, one separately authorized real request and review of draft preservation. Migrated backend/verify-v2.mjs activation assertions and data-URL adapter import rewriting. Its intercepted publication rehearsal passed, including independent Claude budget activation and publishing gates, session/owner validation, RPC payload and storage rejection. No hosted data or allowance was tested.
