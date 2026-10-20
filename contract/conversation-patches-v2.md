# Conversation patches v2 — compact provider DTO

Brief: brief/project.json v58.2026-10-18. PM agreed this internal-only correction before implementation. Browser request/response, conversationState and domain patch rules remain v1 unchanged. Frontend needs no code changes.

## Reason

The first wide nullable patch exceeded Claude structured-output schema complexity limits. Official structured-output documentation sets at most16union-typed parameters and24optional parameters across a request. This was discovered before any paid production test. A successful deployment/build did not verify provider schema acceptance.

## Provider representation

`{reply,patch:{text,flags,duration,ticketTiers,schedule,paymentPreferences,clearFields},sources,pending}`. All listed properties remain required in the provider schema; unchanged arrays are empty and unchanged nullable groups are null.

- text is an array of `{field,value:string}`. Allowed fields: title,type,description,location,timezone,price,capacity,ticketFormat,businessAddress,eventAddress,restrictions,disclaimer,refundPolicy,referralPercentage. No nullable scalar per text field. Runtime domain validation checks enums and semantics.
- flags is an array of `{field,value:boolean}` for sameLocation,supportiveMessage,referralEnabled.
- duration remains nullable integer:1union.
- ticketTiers remains nullable array, with four nullable category fields:5unions.
- schedule remains nullable object, with six nullable fields:7unions.
- paymentPreferences remains nullable array:1union.
- clearFields,sources,pending remain existing typed arrays without unions.

Total14union-typed parameters and0optional parameters. Empty text/flags arrays mean no scalar changes, not clearing existing fields. Duplicate field entries, unknown fields, invalid DTO types or incomplete envelopes are explicit provider-format errors. Valid typed field values with invalid business meaning still reach the existing domain clarification path. No legacy wide provider DTO is accepted in production.

Decode the compact provider response inside lib/claude-ai.mjs into the existing flat domain patch before route/application. This is a network boundary concern. No DTO details leak to the browser. Preserve1800output cap, same model/settings/budget, no automatic retries/fallbacks.

## Guard and verification

Add a recursive schema-complexity counter and pre-request guard enforcing at most16unions and24optional parameters. Tests assert actual current schema count14/0, fail a deliberately oversized schema before fetch, verify compact-to-domain decoding, reject malformed/duplicate/legacy DTOs, and migrate actual-provider/route fixtures. Existing domain/client tests remain unchanged. Backend owns implementation and evidence. PM owns rollback/rebuild/deployment. No paid call by specialist.

Official source read: https://platform.claude.com/docs/en/build-with-claude/structured-outputs#schema-complexity-limits .

Enum compatibility: provider enum casing is canonicalized case-insensitively at decoding, following official guidance. This includes field identifiers, schedule kind, clear/source/pending names and known type/ticket/payment values. User-authored titles/content/sourceText are preserved. Internal grammar-size limits still require actual provider verification; passing explicit14/0 checks alone is not a live-success claim.
