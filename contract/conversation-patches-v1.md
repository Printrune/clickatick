# Conversation patches v1 — proposal, not approved

Brief: brief/project.json v57. Owner follow-up: this must fundamentally cover every field, rather than a date exception. Date:2026-10-18. No implementation under this proposal yet. The date-only patch must not deploy.

## Caller usage

Request `/api/chat` remains `{messages,draft}` and adds optional `conversationState`. Response remains `{reply,draft,speech?}` and adds `conversationState` and `outcome`. All drafts remain validated, editable listing documents. Incomplete answers belong to conversation state, never to publication fields.

Example: user says two days before Halloween. The model supplies no complete date patch and requests clarification of the year. Server retains that exact phrase as pending schedule evidence and returns a normal spoken question. User answers2026; state retains both phrases even after chat history trimming. User answers6pm; the model can propose the completed local date/time grounded in these facts. Server validates before acceptance. No midnight, current-year or fake-location defaults are required.

## Why change the shape

Current answerSchema in lib/claude-ai.mjs requires a complete listing and complete schedule on every turn. app/api/chat/route.js validates that entire regenerated object. One invalid date, price, capacity, timezone or ticket identity rejects the turn; unrelated accepted fields can also be overwritten. Existing nullable setupPatch already demonstrates preserve-on-null behavior for organiser settings. Generalize that boundary instead of adding per-error catches.

## Exact proposed browser contract

`conversationState:{version:1,pendingFacts:[{field:string,sourceText:string}]}`. Allowed field values are the public change field names below, plus schedule. At most12 facts, sourceText1..500 characters, total state6000 UTF8 bytes. Missing state means empty. It is untrusted, bounded context, never executable instructions or confirmed listing data. Values are exact organiser utterance excerpts, not model-generated dates or inferred attributes. Do not send venue photos or avatar data. Persist beside draft/messages locally; clear on reset; include in request byte accounting. State from older clients defaults empty. Unsupported versions fail request validation with a clear recoverable error.

`outcome:{appliedFields:string[],clarificationField:string|null}`. Names come from an allowlist, never provider text. appliedFields lists values actually changed by validated application. A clarification-only answer has an empty array. Frontend increments illustration progress and shows saved feedback only for actual changes. It still speaks a successful clarification and resumes listening. Existing consumers can ignore these additive fields.

Successful clarification is HTTP200. Genuine connection, quota, authentication, incomplete/unreadable provider output, request-size or invalid client draft remains an explicit error. Never fabricate a reply claiming the provider succeeded. An explicit user retry can make a new paid request; no automatic second model call, fallback model or paid repair call.

## Proposed provider response

Replace whole `draft` output with `{reply,patch,pending}`. Keep the pinned Claude model, gates, request timeout, token cap and spend authorization until separately reviewed. Provider schema uses typed nullable fields: null means unchanged; an omitted field is also unchanged at runtime. Empty strings do not implicitly clear existing values. Explicit clear operations are separate and require user evidence.

Patch fields:

- title, type, description, location, timezone, price, capacity, duration, ticketFormat: typed nullable scalars.
- ticketTiers: null or an atomic proposed array preserving existing IDs; new IDs assigned by server, not hallucinated by model. Use existing IDs or a bounded new-item token in the provider DTO; translate before parseListing. Never silently replace or delete sold/persisted categories.
- schedule: null or typed partial schedule patch. Nullable kind, dates, start, until, time, weekdays preserve existing values. Complete date/time entries only enter dates. Partial spoken facts go to pending; never force partial facts into strict schedule fields. A change to schedule.kind is atomic with its applicable schedule values to avoid stale fields from the other mode.
- setup fields mirror existing nullable setupPatch: businessAddress, eventAddress, sameLocation, restrictions, disclaimer, refundPolicy, supportiveMessage, referralEnabled, referralPercentage, paymentPreferences. No photo, pin, disclaimerReviewed, publication or account mutation may come from the model.
- clearFields: bounded allowlisted array, only explicit organiser instructions, supported for editable scalar text/settings; never a wildcard or a whole draft reset.
- sources: bounded `{field,sourceText}` evidence entries for each non-null patch or explicit clear. sourceText must be an exact substring of a supplied user message or existing pending fact. A source is provenance, not proof that a semantic inference is correct. No matching source means reject that proposed field and clarify; never delete the accepted old value.

`pending` contains bounded `{field,sourceText,question}` requests. Only the raw field/sourceText reaches durable conversationState. The server validates sourceText provenance, bounds and field. Questions are one focused request for a missing fact; no policy/medical/legal advice, avatar questions or invented requirements. Keep at most one selected clarification per response, retain other pending facts for subsequent turns.

## Server application and ownership

New pure module `lib/conversation-patches.mjs` owns provider parsing, evidence matching, patch grouping, application, bounded pending facts and outcome. It receives the validated accepted draft, bounded prior state, messages and untrusted provider output. It returns the accepted draft, safe reply decision, next state and outcome. It has no network or framework dependencies.

Apply independent scalar changes separately. Apply interdependent groups atomically: ticket tiers/price/capacity; schedule/type/timezone; business/event addresses/sameLocation; referral enablement/percentage. Each candidate group is merged into the latest accepted draft and checked with existing domain validation. A group's invalid members cannot overwrite the old group or block unrelated valid groups. Setup media/pin preservation and disclaimer review rules continue through existing merge logic. Final combined draft passes parseListing. No raw provider object becomes browser draft.

If any group is rejected, discard the provider acknowledgement to avoid false claims that rejected values were saved. Return one server-owned clarification for the first relevant rejected or pending field. Use neutral wording such as What ticket price should I use? rather than claiming every proposed field saved. Accepted groups remain in draft/outcome. This mechanism applies to every editable field, not string matching of validator error messages. Domain validators provide structured field/group issue codes for selecting questions; ordinary validation copy stays separate.

Pending update is transactional with accepted fields. Resolve facts only when that field/group is actually accepted, or the user explicitly supersedes/clears them. Retain exact unresolved phrases and subsequent focused answer facts. A malformed provider pending list cannot delete old facts. Bound growth deterministically and ask for clarification before exceeding the state limit, without losing the last accepted draft. Never turn an arbitrary provider exception into a claimed successful interpretation.

## Roles and migration

Backend owns provider schema/prompt, conversation-patches domain module, typed validation issue adapters, route integration, provider/route/group tests and backend/conversation-reliability-v1.md. Frontend owns Workspace state persistence, chatPayload byte accounting, scene applied feedback, browser fixture and frontend/conversation-reliability-v1.md. PM owns brief/version, model/budget choice, acceptance, final build/deployment and browser verification. Independent reviewer tests the agreed contract and failure paths. Agree this contract with Frontend/PM before coding.

Replace the date-only helper/caller in the same implementation; do not leave both recovery paths or legacy whole-draft provider handling. Existing browser request drafts stay compatible; provider response migration is internal and atomic with route update. Source-loader tests must import the new module. No new database, auth, payment or hosting integration.

## Alternatives considered

1. Whole listing plus increasingly broad catch: smallest diff, but rewrites unchanged facts and cannot represent partial answers. Rejected.
2. Generic event-sourced operations/utterance ledger with replay: excellent audit detail but more lifecycle/replay complexity than this anonymous device draft needs. Defer.
3. Nullable field patches plus bounded pending facts: existing setupPatch precedent, one accepted draft owner and clear partial-answer state. Recommended.

## Acceptance evidence required

Actual mocked handler and controller/browser sequences for dates/year/time, invalid prices/capacity, multiple ticket types, corrections/clears, unknown timezone, setup/referrals, several valid facts plus one rejected fact, no-change replies, history trimming and reload. Prove accepted facts persist, rejected values never leak, no false saved feedback, one question is spoken, listening continues and no extra paid request occurs. Confirm genuine provider failures remain explicit and draft-safe. Run existing complete suite/build and actual desktop/mobile flow. No claims that a model can never misunderstand; verify resilient behavior when it does.

## Risks and decisions

Exact source matching cannot prove correct interpretation; it prevents unsupported provenance and helps preserve context. Domain group granularity must avoid rejecting unrelated facts without allowing inconsistent inventory or schedule. State bounds and user corrections need specific tests. Additional schema/token overhead must fit existing request/output caps; measure with fixtures before considering a separate cap/budget change. PM/Frontend approval required before implementation. No provider/model change proposed here.

## Agreed implementation amendment — brief58

PM approved on2026-10-18; Frontend acknowledged shared parser and additive state before implementation. Omit outcome: client compares validated returned drafts for real changes. Backend owns browser-safe lib/conversation-state.mjs exporting parseConversationState(value); undefined defaults empty. Frontend persists state and includes it in request byte limits. Bounds and shape above unchanged. Provider/model failures remain explicit. All invalid model patch proposals become truthful200clarifications, retaining accepted draft/state; no validator message string switches. Independent domain groups use existing parseListing semantics. Date-only helper is removed in this wave.

Supported model allowlist: claude-haiku-4-5-20251001 and default claude-sonnet-5-5. Sonnet requests use thinking:{type:'between_tools'}, output_config.effort:'low', no temperature, no tools or other thinking fields. Existing1800 output cap retained. No automatic model fallback. PM owns activation/deployment; no paid calls by specialists. Official Sonnet5.5 overview and whats-new docs read; $2 input/$10output per1M tokens confirmed by PM. Existing USD10 prepaid ceiling/no refills unchanged.

Backend files: conversation-state.mjs, conversation-patches.mjs, claude-ai.mjs, chat route, backend tests and source-loader migrations. Frontend files: chat-client.mjs, chat-context.mjs, Workspace and client tests/fixtures. Pending facts overflow never silently evicts unresolved evidence: preserve prior state and accepted draft, and explicitly ask to finish an existing pending field before adding more; latest answer remains visible in chat and is not represented as saved.

Manual organiser edits clear corresponding pending fields before the next request. Client preserves unrelated pending facts. Calendar edits clear schedule/type/timezone facts; category/price/capacity edits clear inventory facts; address/sameLocation edits clear location facts; referral edits clear referral facts. This reflects explicit organiser corrections, not model acceptance. Frontend/PM agreed during implementation.

Final provenance amendment agreed by PM: a patch source must quote the latest user utterance or retained unresolved pending fact. Older resolved user messages remain reasoning context but cannot authorize replaying a prior change over manual edits or duplicate a category. This changes no browser wire shape. Regression tests cover old price replay after manual edit and old category-add replay.
