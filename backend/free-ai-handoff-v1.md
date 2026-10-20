# Free AI connection handoff v1

Date: 2026-10-17. Role: Backend Engineer. Input brief: brief/project.json version 12, refreshed to version 13 before handoff.

The latest owner instruction supersedes the brief's USD 10 paid allowance. Use free plans only, no top-ups, and Vercel AI Gateway free credits. The owner also requested replacing Supabase with services managed through Vercel. This handoff changes no running service or credentials.

## Current code facts

- app/api/chat/route.js already uses the Gateway-compatible Chat Completions endpoint. It bounds message input and output, validates structured drafts, and never publishes from an AI reply.
- AI_BASE_URL defaults to https://ai-gateway.vercel.sh/v1. AI_API_KEY supplies the bearer credential manually. The code does not currently read AI_GATEWAY_API_KEY or use Vercel deployment identity tokens.
- lib/services.js requires Supabase URL and service key before declaring AI connected. Each chat request first calls reserve_ai_budget through Supabase REST.
- database/setup.sql hard-codes a USD 10 lifetime reservation ceiling. It does not reset monthly or read the Gateway balance.
- Authentication, session lookup, publication, and public listing reads also use Supabase. Changing the AI key alone does not remove this dependency.
- AI_ENABLED and PUBLISHING_ENABLED remain false in the example configuration. No live request, account, hosted database, email delivery, or deployment was verified here.

## Verified provider facts

Vercel currently includes USD 5 monthly Gateway credits. Only eligible models qualify, with lower rate limits. Buying credits ends this free allowance. The period begins with the first request. The balance is shared at team level, so another project can consume it. Source: [Gateway pricing](https://vercel.com/docs/ai-gateway/pricing), checked 2026-10-17.

Gateway accepts an API key or Vercel identity token. The existing manual bearer request can use a Gateway key without adopting another SDK. Keep it server-only. Source: [Gateway authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok), checked 2026-10-17.

The free model catalog is [the eligible-model filter](https://vercel.com/ai-gateway/models?freeTier=true). No model has been selected or tested for TicketNest.

## Required implementation before enabling AI

1. Agree a new API contract with Frontend before changing availability, login, or storage behavior.
2. Replace the Supabase budget call with an atomic reservation transaction in the replacement database.
3. Set an application allowance no greater than the verified remaining free credit. Preserve reservations on errors and uncertain responses.
4. Keep a lifetime USD 5 application ceiling initially. Do not add an automatic monthly reset until the actual provider period is known.
5. Select an eligible model. Verify its structured JSON support, token accounting, and maximum cost for bounded requests.
6. Include draft, system instructions, conversation, output, and any billed reasoning tokens in the worst-case reservation. Reject models without a defensible bound.
7. Explicitly map AI_GATEWAY_API_KEY or document the existing AI_API_KEY mapping. Do not silently activate from credentials alone.
8. Restrict requests to the selected model. Prevent paid provider fallback and bring-your-own-key paths.
9. Keep top-ups and auto top-ups disabled. Confirm account balance and free-tier status before the first test.
10. Add abuse controls for anonymous drafting and an explicit exhausted-credit response. Same-origin validation alone does not prevent scripted abuse.
11. Test missing configuration, rejected reservation, concurrent final reservations, Gateway errors, malformed output, and expired credits with intercepted requests first.
12. Run one bounded real listing request only after connection and cost checks. Verify its result and the actual account credit change.

## Remaining storage and login work

Prepare a fresh replacement schema rather than applying the Supabase bootstrap unchanged. It references auth.users, Supabase roles, and REST publication. Preserve owner isolation, atomic event/ticket-type publication, recurrence validation, and public projection privacy. Replace the session and email-code adapters with a real login service. Database selection through Vercel Marketplace does not provide those login features automatically.

Keep current local draft editing available throughout. Leave publication disabled until real login, persistence, and public reads pass verification. Payments remain outside the demonstration.

## Safe configuration before connection

AI_ENABLED=false and PUBLISHING_ENABLED=false remain the safe defaults. Keep credentials empty in tracked files. Store future secrets only in local ignored settings or Vercel server environment settings. Do not set AI_MAX_REQUEST_USD until the chosen model's upper bound is verified.

## Evidence and gaps

Read backend role, shared rules, brief-to-site, workshop-owner-language, and unslop skills. Inspected the actual chat route, connection gate, example settings, and SQL allowance. This was a read-only audit except for this file. No runtime tests were needed because implementation did not change. Existing local database tests do not verify a future hosted replacement.

Decisions needed: No repeated product intake. The immediate next step is installing the suggested Vercel integration and connecting the owner's account. PM must resolve replacement database and login provider before migration. Account connection and eligible-model availability remain unverified.
