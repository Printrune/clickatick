# Claude API contract v1

Brief read: version 18. Owner then selected direct Claude API and approved USD 10 total testing. PM records the superseding brief.

The browser contract stays POST /api/chat with messages and draft, returning reply and validated draft. No publication side effects. Frontend interface unchanged; PM confirmed interface agreement before implementation.

Server calls only https://api.anthropic.com/v1/messages using a server-only ANTHROPIC_API_KEY. AI_PROVIDER must equal anthropic, AI_ENABLED and ANTHROPIC_BUDGET_CONFIRMED must equal true. Confirmation means a verified dedicated provider allowance of at most USD 10 total with no automatic refill, not merely a resetting monthly limit. Otherwise remain disabled. There is no hosted durable usage ledger yet.

Pinned model claude-haiku-4-5-20251001 supports structured JSON output. Verified 2026-10-18 at https://platform.claude.com/docs/en/models/haiku-4-5/overview and https://platform.claude.com/docs/en/build-with-claude/structured-outputs. Listed prices USD 1 per million input tokens, USD 5 per million output tokens. Maximum output 1800 tokens, request payload bounded to 40000 UTF-8 bytes. No tools, thinking, retries, caching, provider fallback or browser credential exposure.

Network, auth, allowance and malformed/truncated responses have safe errors. The original draft remains in the browser. Schema constrains shape; parseListing remains authoritative for semantic validation.
