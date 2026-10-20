# TicketNest backend review v1

Date: 2026-10-17. Shared brief version: 9. Review only. No implementation changes or external connections.

I loaded the supplied Backend role, CLAUDE.md, starter AGENTS.md, brief-to-site, signup, cro, its form reference, and workshop-owner-language. I also read the generated marketing context, README, and brief implementation. The contract is retrospective because the implementation already exists.

## Findings

### High: direct database writes bypass publication validation

Evidence: database/setup.sql:11 and :15-17 grant authenticated users owner-scoped insert and update. The content constraint at :5 checks only byte size. The public view at :19 selects every published row.

A signed-in client can use its own bearer token directly against the database API. It can insert its own listing with published true and incomplete or malformed content. This bypasses parseListing and publicationErrors in app/api/listings/route.js. The public page parses content, but does not call publicationErrors. Structurally valid incomplete content can render publicly. Malformed content can cause a render error.

Recommendation: enforce publication invariants at the database write boundary, or remove direct write grants and provide a validated server-controlled write path. Retain owner checks independently. Prove that direct database requests cannot publish incomplete content.

### High: anonymous callers can consume the shared AI allowance

Evidence: app/api/chat/route.js:5 checks Origin only. Lines 12-18 reserve shared allowance before the model call. There is no visitor throttle, bot protection, or per-session quota.

Any HTTP client can supply the expected Origin. Repeated valid calls can exhaust the demonstration allowance. No refund occurs on failures. The conditional reservation aims to bound total reservations, but cannot preserve access for legitimate visitors.

Recommendation: add bounded anonymous usage controls before public activation. Verify concurrent requests and allowance exhaustion. Authentication must remain optional for draft creation under the approved scope.

### High: the $10 actual-cost guarantee is unverified

Evidence: app/api/chat/route.js:12 accepts a manually configured reservation between zero and one dollar. Line 20 sends a model name, bounded history, current draft, and max_tokens 1800. database/setup.sql:29 limits reservations, not measured provider charges. .env.example asks the operator to verify maximum cost.

No configured model, rate calculation, usage reconciliation, or provider spending control was available for inspection. The implementation can cap reservations at $10. It does not prove actual AI charges remain below $10 if the configured reservation is too small.

Recommendation: verify the exact provider/model maximum request cost before activation. Include input, output, and any additional billable tokens. Reject unsupported pricing or request settings. Test reservation concurrency against a disposable database. Do not claim a tested spending cap yet.

### Medium: environment values alone enable external operations

Evidence: lib/services.js:4 checks only configuration presence. app/api/auth/route.js can send email codes; app/api/listings/route.js publishes without consulting brief publication gates. Brief v9 remains isDemo true, publicationApproved false, siteUrl null.

Adding credentials can enable sends and publication before a separate release review. The source does not enforce the project's stated publication gates.

Recommendation: add explicit server activation controls and require a reviewed release configuration. Keep per-organiser Publish confirmation. Deployment and live service activation remain PM decisions.

### Medium: request limits apply after bodies are fully buffered

Evidence: chat route lines 8-9 and listings route line 9 call request.text before checking size. Auth route line 7 calls request.json without an explicit body limit. Large bodies therefore consume memory before application rejection. Hosting limits may mitigate this, but no deployment limits were verified.

Recommendation: enforce byte limits while reading bodies, alongside platform limits. Test oversized bodies and non-ASCII listing content. Listings currently check UTF-16 string length while SQL checks bytes of serialized JSON.

### Low: malformed messages expose implementation errors

Evidence: chat route line 11 accesses m.role without checking each item is a non-null object. A messages array containing null throws a TypeError. The catch at line 25 sends error.message to the caller.

Recommendation: validate message objects at the request boundary and return a stable client error. Use generic errors for provider failures and retain internal detail only in safe server diagnostics.

## Verification performed

I inspected services, listing validation, all three API routes, setup SQL, public listing rendering, environment template, and listing tests.

Command, from starter: `node --test tests/listing.test.mjs`.

Actual result: 8 tests, 8 pass, 0 fail. Cases cover incomplete drafts, complete events, deduplicated dates, weekly ranges, invalid values, free tickets, unfinished date inputs, and event/weekly mismatch. This run did not access any external service.

No SQL execution or endpoint integration test occurred. I did not test row policies, view ownership, database grants, reservation concurrency, OTP email, real login, publication, or model output. Existing build claims in the brief are prior evidence, not results from this review.

## Checks required before activation

- Exercise route origin, configuration, validation, size, timeout, and provider-error branches with isolated adapters and no external sends.
- Test cross-owner upsert rejection, direct database publication validation, and anonymous visibility against a disposable database.
- Confirm public view ownership and that anonymous users cannot access owner identifiers or unpublished rows.
- Run concurrent reservation calls and prove exactly the allowed reservations succeed. Confirm non-service roles cannot call the function.
- Verify the email template returns the supported code format. Test failed verification, expired sessions, cookie flags, logout, and draft preservation.
- Rehearse idempotent publication, database failure, free tickets, non-ASCII content, multiple dates, and weekly schedules.
- Verify provider model pricing and maximum charges, then perform only an explicitly approved minimal live check.

## Decisions needed from PM

No new owner questionnaire is needed for these findings. PM should prioritise validation and allowance protection before public activation. Provider selection, account creation, email configuration, and service activation remain pending separate instructions. Keep payments excluded and CLIProxyAPI deferred.
