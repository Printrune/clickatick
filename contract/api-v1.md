# TicketNest API contract v1

Date: 2026-10-17. Shared brief version: 9.

This is a retrospective description of implemented behavior. It is not a preimplementation agreement with Frontend.

## Ownership and dependencies

Backend owns `lib/services.js`, `lib/listing.mjs`, `app/api/*`, and `database/setup.sql`. Frontend consumes these interfaces and owns conversation, draft editing, voice controls, and publication confirmation. PM owns service activation and publication approval. This review changed no implementation.

All mutating routes require an Origin header matching the request URL origin. Failures return JSON `{error:string}`. This is a browser request check, not authentication or abuse prevention.

Publishing requires server environment values SUPABASE_URL and SUPABASE_ANON_KEY. AI requires AI_API_KEY, AI_MODEL, AI_MAX_REQUEST_USD, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY. AI_BASE_URL defaults to the Vercel AI Gateway compatible endpoint. Presence checks do not verify connectivity, migrations, email configuration, provider access, pricing, or approval.

Brief v9 records no connected accounts and no spend. This review made no external requests. Database installation, email delivery, model behavior, and production hosting remain unverified.

## Listing data

Draft fields are title, type, description, location, timezone, price, capacity, duration, and schedule. String fields are required even when empty. Type is event or activity. Price is a USD decimal string. Capacity is an integer string. Duration is an integer between 5 and 1440 minutes. Timezone is an Intl-recognized IANA zone.

Schedule contains kind, dates, start, until, time, and weekdays. Kind is dates or weekly. Dates contains at most 50 local YYYY-MM-DDTHH:mm values. Empty date inputs are removed. Start and until are YYYY-MM-DD strings or empty. Time is HH:mm or empty. Weekdays are integers 0 through 6. The parser sorts and deduplicates dates and weekdays.

Publication requires title, description, location, price, and capacity. Individual schedules need at least one date. Weekly schedules need a complete range, time, weekdays, and one occurrence. Events cannot use weekly schedules. Dates have no UTC offsets. Past times and daylight-saving gaps are not checked.

## HTTP interfaces

| Interface | Input | Success | Failure behavior |
|---|---|---|---|
| POST /api/chat | `{messages:[{role:"user" or "assistant",content:string}],draft}` | `{reply:string,draft}` | 403 origin, 503 unconfigured, 413 input above 24,000 bytes, 429 allowance exhausted, 400 validation/provider/timeout/response errors |
| POST /api/auth | `{email:string}` | `{sent:true}` after provider accepts OTP request | 403 origin, 503 unconfigured, 400 generic login error |
| POST /api/auth | `{email:string,code:string}` | `{signedIn:true}` and HTTP-only session cookie | Same failure classes; code must have 6 to 8 digits |
| DELETE /api/auth | No body | `{signedIn:false}`, local cookie deleted | 403 origin |
| POST /api/listings | `{id:UUIDv4,draft}` | `{url:"/listing/<id>"}` after database upsert | 403 origin, 503 unconfigured, 401 no valid session, 400 validation/storage errors |
| GET /listing/:id | Listing identifier | Rendered published listing | 404 missing/unconfigured; render error on database or malformed content |

Chat accepts 1 to 30 messages with at most 3,000 characters each. It sends the full current draft and history to the provider. The provider returns one JSON completion, not a streamed response. Output reply is limited to 3,000 characters. Output draft passes the same parser.

Authentication uses Supabase email OTP. Verification stores only an access token, with at most one hour cookie lifetime. There is no refresh or session-status endpoint. Logout removes the local cookie without revoking the upstream token. The application does not collect passwords.

Publication upserts by client-generated UUID and sets published true. Repeating a request updates the same owned listing. There is no unpublish, delete, private server draft, payment, booking, or ticket inventory interface.

## Persistence and allowance

The listings table stores id, owner_id, content JSON, published, and created_at. Row policies restrict authenticated reads and writes to owner_id. Anonymous table access is revoked. An owner-executed published_listings view exposes published id, content, and created_at to anonymous readers. Database content checks enforce size only, not the listing schema.

The singleton ai_allowance row tracks reserved_usd up to 10. A service-role-only function conditionally increments it before each provider request. There are no refunds, even on provider failure. AI_MAX_REQUEST_USD is a manually configured reservation. Correct cost coverage requires independently verified provider rates and request bounds. It is not a measured cost ledger or a verified spending guarantee.

## Verification limits

The listing unit suite passed 8 of 8 tests during this review. No database transaction, row-policy, email, model, session, or publication integration test was performed. See `backend/review-v1.md` for release blockers and recommended checks.
