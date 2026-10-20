# Imported backend audit v1

2026-10-17. Backend specialist. Shared brief version 11. Read-only source inspection of imported-ticketing. No credentials read, SQL applied, services contacted, or downloaded setup executed.

## Finding

The archive is a Vite React client that talks directly to Supabase, plus 18 SQL migration files and one translation edge function. It is not a separately deployable application server. Keep the approved Next.js site and its AI connection. Reuse the event and ticket tier concepts through a server adapter, not the whole client or migration history.

An event listing and an admission ticket are different records. `events` describes the listing. `ticket_tiers` describes purchasable admission categories, price, and inventory. `orders` describes the buyer's transaction. `tickets` issues one admission credential per person, with a QR token. Publishing an AI-created listing must create an event and tiers, not valid admission credentials.

## Authoritative source

Read migrations in chronological filename order, rather than trusting generated types alone. Initial migration 20260308121559 creates organizers, events, ticket_tiers, orders, tickets and auth.users signup trigger. Later migrations add seating, translations, administration, promotions and ancillary commerce data. There is no profiles table in this core model. `organizers.user_id` owns the event account. Initial event types are one_time, recurring, transport and general_admission. Core schedule fields are starts_at, ends_at and recurring_rule JSONB; explicit occurrence inventory and timezone are not represented as first-class rows.

`src/hooks/useEvents.ts` saves event and tiers as separate requests. Updates delete and replace every tier. The initial schema cascades tier deletion to tickets, so this update pattern can delete issued admissions. Do not port it.

## Security and correctness blockers

- Latest policy migration 20260308191353 recreates tickets SELECT with USING(true). Its name mentions QR token, but the policy does not constrain by a token. Anonymous clients can enumerate ticket credentials if table grants permit the operation.
- Same migration permits orders and tickets INSERT with WITH CHECK(true). Browser input can choose organizer, event, tier and order associations. Foreign keys do not prove their cross-record ownership matches.
- `src/hooks/useCheckout.ts` sets non-cash orders to confirmed without contacting a payment processor. It trusts client price and discounts. This is not verified checkout.
- Checkout writes order, tickets and inventory in separate operations. Inventory failure leaves previous records behind. Retry can create duplicate admissions.
- increment_tier_sold in 20260308165834 locks the tier row and checks maximum inventory, but permits negative amounts and lacks caller ownership checks. decrement_tier_sold in 20260308170235 similarly lacks ownership checks. Both are SECURITY DEFINER. No execute revocation was found in the inspected migration set.
- `20260308203637` exposes waitlist rows, transfer rows, order addons, pass holders and form responses with broad SELECT policies. Several policy names imply ownership but their predicates are USING(true). Do not import these tables without separate review.
- Organizer SELECT is public for every column, including user_id. Publish an explicit public projection instead.

## Lovable and missing services

`supabase/functions/translate/index.ts` calls ai.gateway.lovable.dev with LOVABLE_API_KEY. It uses service-role data access, accepts entity identifiers, and contains no caller ownership verification in the handler. Remove this integration from any adopted runtime. Keep TicketNest's own reviewed AI adapter and budget guard.

`vite.config.ts` loads lovable-tagger; package.json includes it. Supabase config.toml pins the originating project. Do not reuse that project identifier or the excluded environment file. Lovable branding/build hooks and generated project instructions are not needed in Next.js.

Only translate exists under supabase/functions. No included payment processor, payment webhook, transactional checkout service, email sender or webhook delivery worker was found. UI confirmation wording and saved email campaigns do not establish delivery. Sold-count and promo RPCs do exist; they must not be mistaken for missing implementations.

Public imported routes include /:orgSlug, /:orgSlug/events/:eventId, /tickets/:qrToken, /transfer/:token and /discover. They are React views, not server publication guarantees. Preserve current /listing/:id rather than importing competing router paths.

## Skills and limits

Read backend role, team/shared-rules-v1.md, starter AGENTS.md and README, brief-to-site/SKILL.md, unslop, principle-boundary-discipline and principle-foundational-thinking. Source review only, no runtime or database claims. Generated TypeScript was not modified.

## Decisions needed

PM must resolve whether the requested ticket creation means event listings with ticket types, or actual admission issuance. Recommend listing plus ticket types first, consistent with payments excluded. Existing activation gates and USD 10 AI budget remain unchanged. If actual admissions are required, establish free registration versus later paid fulfillment before implementing checkout.
