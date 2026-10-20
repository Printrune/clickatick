# Conversation reliability — Backend proposal v1

Brief: brief/project.json v57.2026-10-18.

Owner broadened the requirement from a date symptom to reliable understanding across all ticket fields. No further server implementation made after that direction. The date-only changes are local and must not deploy separately.

Inspected actual provider schema, chat handler, listing/setup validators, chat payload bounds and voice controller. The structural cause is a full required draft regeneration each turn, combined with whole-document validation and no durable representation for incomplete facts. A model upgrade alone cannot remove these boundary failures.

Proposed contract: contract/conversation-patches-v1.md. Recommend typed nullable changed-field patches, independent validated domain groups, bounded pending raw user facts outside the publishable draft, provenance checks, truthful applied-field metadata and a normal spoken clarification for rejected or incomplete values. Retain genuine provider failures as explicit recoverable errors. No automatic paid retries, model switch or spend change.

Frontend request/response additions proposed: conversationState and outcome. Existing reply/draft/speech stay. Frontend stores pending context across trim/reload and updates scene feedback only for accepted changes. Backend owns schema, server application, group validation and route tests. Need PM/Frontend contract agreement before coding.

Alternatives recorded: fullrewrite plus catches rejected; replay ledger deferred; nullable patches plus bounded pending facts recommended. Verification matrix includes every editable field family, mixed valid/invalid answers, correction/clear, trimming/reload, optional speech and genuine API failure.

Skills read this task: architect; prior root-cause/boundary/proof skills and project brief-to-site/ownerlanguage. No service calls, secret reads, install, environment changes or deployment. Decisions needed: PM/Frontend architecture agreement, including exact bounded state shape and atomic domain groups.
