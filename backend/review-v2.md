# TicketNest backend review v2

Date: 2026-10-17. Shared brief version: 9.

## Changes

PM agreed contract/api-v2.md before implementation. POST /api/listings keeps its public request, response, and error contract.

The server still verifies the session, parses the listing, and checks publication requirements. It now calls publish_listing with a server-only service-role credential. The owner identifier comes from the verified session, not the request body.

The SQL revokes table permissions from PUBLIC, anonymous, and authenticated roles, then restores authenticated read access. Old insert/update policies are removed. The new service-role-only function inserts or updates a listing. Its conflict update requires the existing owner to match the supplied verified owner. An ownership conflict raises an error without updating content or owner.

AI_ENABLED and PUBLISHING_ENABLED default off. Both require the exact value true. Publishing additionally requires the private service-role credential. Credentials alone enable no external operations. The environment example and connection handoff explain these controls.

The mandatory AI allowance reservation is unchanged. No client source or listing parser changed. No service connection, email, model call, database execution, deployment, or spend occurred.

## Actual verification

Run these commands from starter:

```text
node backend/verify-v2.mjs
node scripts/configure.mjs --check
node --test tests/*.test.mjs
node node_modules/next/dist/bin/next build
```

- The retained mock route rehearsal passed. It executes the current route, listing parser, and service helpers with a fake cookie provider and intercepted fetch calls.
- It checked disabled defaults, explicit activation, missing service credentials, foreign Origin, disabled publication, expired session, incomplete listing, invalid identifier, verified-owner payload, service credentials, successful response, and storage rejection.
- The brief contract passed.
- All 19 unit tests passed, with zero failures.
- The production build failed before compilation. Turbopack could not canonicalize the starter path and reported Access denied, os error 5. No successful build is claimed for this patch.

The normal npm commands were unavailable on this shell PATH. The commands above invoke their underlying Node entrypoints directly.

I read the installed Next.js route-handler and cookie references before editing server behavior. Static inspection confirmed the SQL revocations, restricted function execution, and owner condition. Static inspection cannot prove deployed database privileges or transaction behavior.

## Remaining activation blockers

- Apply the reviewed SQL to a disposable database and verify anonymous/authenticated direct table writes fail. Existing databases need the new revocations before activation.
- Verify only service_role can invoke publish_listing. Verify create, repeat publish, same-owner update, and cross-owner conflict, including concurrent calls.
- Verify owner isolation, anonymous public reads, view ownership, content size constraints, and the absence of owner identifiers in public output.
- Verify concurrent allowance reservation and depleted allowance against the real database.
- Add per-visitor anonymous AI abuse controls. Origin checks cannot stop scripted allowance exhaustion.
- Select and verify a model's maximum request cost before enabling AI. Reserved amounts do not establish actual provider cost.
- Test real email delivery, login, session expiry, publication, model output, and voice only after approved service activation.
- Complete a successful build in an execution context that permits Turbopack path access.

V1 findings about fully buffered bodies and malformed chat errors remain open. This bounded patch addresses publication write bypass and explicit activation. It does not claim database integration, cost enforcement, abuse protection, or live-service verification.

## Decisions needed

No new owner question is required for this patch. PM should keep activation disabled until release blockers are resolved. Preserve the approved scope, excluded payments, and deferred CLIProxyAPI integration.
