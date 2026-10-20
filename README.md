# TicketNest

Current state: clickatick is deployed on Vercel with direct Claude API conversation. The owner approved up to USD 10 total Claude API testing, using prepaid credit without automatic refills. No Ollama is installed or required. Read brief/project.json for current release evidence.

Local account and storage mode: run `node scripts/local.mjs` from this folder. It builds the app and starts a loopback-only server. Use the printed local address. Sign in with the clearly labelled local organiser button, then save the reviewed listing. Listings and ticket types are stored in `.local-data` and survive restarts. This is a local testing account, not email verification. Local listing links are not internet links. Keep `.local-data` backed up and out of Git.

Next.js application for conversational event and activity creation. The local preview supports manual editing, multiple ticket types, recurring schedules, saved drafts, and JSON download. Live Claude conversation is verified. The owner approved anonymous Review then Publish and a simulated guest checkout; hosted email login and real payments remain unconnected. See the release verification artifact before claiming live demo storage success.

## Local development

Use the tested Node 24 runtime and the package manager pinned in package.json.

Commands: pnpm install --frozen-lockfile; pnpm run configure; pnpm run check; pnpm run build; node scripts/preview.mjs.

Run each command separately. The preview script chooses a free loopback port and records its process identifier, command, and working folder. Stop only that recorded process. Use pnpm run dev during implementation if needed.

pnpm-lock.yaml is the canonical dependency lock. The original workshop npm lock remains in the original kit archive. The outdated extracted npm lock was removed after adding the PostgreSQL test dependency.

## Event backend

The owner selected a fresh database and event listings plus ticket types. The imported model supplies organizers, events, and ticket tiers. The adapted schema adds dated occurrences and preserves the AI allowance. Existing owner data and archive environment settings are not reused.

The publication server validates the organiser and draft. A service-only transaction creates or updates the event, ticket types, and occurrences together. Repeat publication preserves identifiers. Private ownership fields are excluded from public reads. Quantities apply to the entire event or series.

Apply database/setup.sql only to a fresh Supabase project. Do not apply the original imported migrations or use this bootstrap on an existing database. The selected integration excludes checkout, orders, buyer information, admission credentials, transfers, and campaign sends.

pnpm run check includes unit tests, actual SQL tests in disposable PGlite PostgreSQL, and isolated publication-route checks. The route rehearsal intercepts external requests. Neither verification connects to a hosted database or AI provider.

## Live connections

Anonymous demo publishing uses a connected private Vercel Blob store and `DEMO_PUBLISHING_ENABLED=true`. The SDK handles connected-store authentication. Publication creates immutable public snapshots; edits publish a new version. Dedicated UUID intents persist before writes, allowing retries without duplicates. Demo checkout computes prices and combined category limits on the server, stores a public-safe confirmation, and charges nothing. No attendee personal information, admission ticket, stock reservation, email delivery or referral payout is created. Global demo limits are20 listings and100 confirmations. This bounded demo is separate from the legacy authenticated database flow. Read contract/demo-publishing-v1.md and any later addendum, plus frontend/demo-publishing-verification-v1.md for the actual release evidence.

Read CONNECTION-HANDOFF.txt and use the empty settings in .env.example. Credentials alone activate no services. Complete release verification before enabling AI or publishing. Keep private provider and service-role keys out of browser code.

The AI service is separate from the imported event system. Its validated changes use the same reviewed event and ticket-type data. CLIProxyAPI remains an optional final integration. The latest owner decision restores the USD 10 total Claude testing allowance. No automatic top-ups are permitted.

Conversation reliability uses targeted field changes and bounded unresolved user facts instead of regenerating the full listing. Valid independent facts persist when another field needs clarification. The browser retains pending context, confirmed scene feedback and failed answers; paid retries require an explicit user action. Claude Sonnet5.5 is the selected production model. Provider format, schema-limit guards and evidence are recorded in contract/conversation-patches-v2.md and frontend/conversation-reliability-verification-v1.md. Browser speech remains available; Fable is disabled without its separate private OpenAI key and activation flag.

## Project workflow

brief/project.json holds shared decisions and approvals. Read its current version before work. The root AGENTS.md, starter AGENTS.md, and team role instructions govern implementation. Preserve the selected design and source licenses. Marketing waits for working-site approval.

The debranded imported Vite application remains reference source outside this starter. It is not served by this app. Its separate dependency installation and build remain unverified.
