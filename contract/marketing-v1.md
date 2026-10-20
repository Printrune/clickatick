# Marketing API contract v1

Brief: brief/project.json v71. Owner approved implementation of listing-workspace-plan-v1.

## Creator access

Publish POST /api/demo/listings accepts existing {id,draft} plus optional creatorToken, a 64-character lowercase hexadecimal cryptographic random secret. Frontend creates it before the first publish attempt and retains the same secret with that immutable publish intent on retry. It must never appear in URLs or exports. Existing callers without the token still publish but receive no creator access. A token hash is bound inside the immutable listing record on creation. Existing legacy listings cannot gain an owner. Changed tokens fail with 409. A successful token-bearing publish sets HttpOnly, SameSite=Strict, Secure in production, Path=/ cookie ct_creator_<id>, expiring 30 days after publication. Do not show success ownership unless authenticated GET succeeds. No public response contains token or hash.

Creator workspace URL /listing/<id>/marketing. API /api/marketing/<id> checks cookie for every request. No login; clearing the browser loses access. Expiry is fixed, not sliding. DELETE permanently revokes this capability server-side and clears cookie. No recovery or legacy migration in this version.

## API

GET /api/marketing/<id> -> {listing: public listing shape, versions: MarketingVersion[], accessExpiresAt: ISO}. 403 for missing, invalid, expired or revoked capability. Listing IDs do not grant access. Cache-Control: private, no-store, Vary: Cookie. Versions newest first. Empty versions means frontend builds an unsaved starter through exported pure helper createMarketingDraft(listing).

POST /api/marketing/<id> same-origin JSON {id: UUIDv4, draft: MarketingDraft}. Saves immutable request/version id, returns {version: MarketingVersion, created:boolean}. Retry same id+content returns existing version, changed content 409. Max 20 versions/listing, 24 KiB request. Draft exact keys: {kind,title,caption,altText,placement}. kind social|poster|video|ad-plan. title max200; caption max6000; altText max1000; placement max100. All strings, title and caption required. Destination always /listing/<id>, never client-controlled.

POST /api/marketing/<id>/approve same-origin JSON {versionId:UUIDv4} -> {version:MarketingVersion}. Approves exact immutable version. Retry idempotent; editing saves a new needs-review version and never changes prior approved versions.

DELETE /api/marketing/<id> same-origin, revokes capability permanently. Returns {revoked:true}.

MarketingVersion exact public shape: {id,listingId,listingFingerprint,createdAt,draft,destination,status:'needs-review'|'approved',approvedAt:ISO|null,demo:true}. All content is deterministic template material, never claimed as AI generation. All exports include demo notice. No external posting, provider, spending, real tickets or payment.

## Ownership

Backend owns lib/marketing-service.mjs, lib/marketing-http.mjs, lib/marketing-draft.mjs, app/api/marketing/*, lib/demo-service.mjs, app/api/demo/listings/route.js, backend tests. Frontend owns pages/components/styles and publish intent generation. Agreement required before implementation.

## Explicit Claude refinement addendum

POST /api/marketing/<id>/refine: {id:UUIDv4,draft:MarketingDraft,instruction:string max1000}. Max12KiB. Returns {draft:MarketingDraft,reply:string,created:boolean,ai:true}. This is a non-persisted candidate; creator reviews and explicitly saves a new immutable version. Fixed provider response {headline,caption,reply}; server preserves kind/placement/altText. Existing claudeReady budget configuration and selected model only, max600tokens, no tools or external fetches. Durable immutable request claims before provider call limit20 global and3 per listing. Successful response cached by id. Same id + different content409. Unknown or failed result does not call again; same id409 with explicit uncertain-result explanation, consumes quota; new attempt requires explicit user action and new id. No automatic retry. Mocked tests only; no paid calls authorized for testing in this task.

GET also returns refinement:{available:boolean,remaining:number}, gated by existing Claude configuration and the three-request listing allowance. It does not reveal credentials or call the provider. PM approved this before implementation.

## Starter helper addendum

PM approved optional third argument createMarketingDraft(listing,kind,direction='introduction'). A direction of 'visit' changes the storyboard opening to the location and places the event title in scene two. The default preserves existing callers. Date summaries use the first wall-time date and an explicit additional-date count with full-schedule referral; complete dates remain in the linked listing. No required restriction, fixed booking destination or demo disclosure is silently truncated. Long valid domain inputs remain below the6000-character caption limit by omitting optional description and compacting the schedule.
PM verification addendum: after the passing build and tests, PM will perform one explicit fictional-marketing Claude request under the owner's existing USD10 total API testing allowance, with no top-ups or new provider. The backend specialist performed mocked calls only. The live check must verify a same-ID retry uses the saved result rather than another provider call.
