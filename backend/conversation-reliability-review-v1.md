# Conversation reliability — independent review v1

Shared brief: `brief/project.json` v58. Governing agreement: `contract/conversation-patches-v1.md`, including its approved brief58 amendment. Reviewed 2026-10-18.

## Result

No remaining blocking findings in the reviewed implementation. The previous date-only recovery path is removed. The chat boundary now accepts changed-field proposals, preserves the last valid listing, retains unfinished raw answers outside listing fields, and returns a spoken clarification when a proposal cannot be accepted. Actual provider and request failures remain explicit.

The contract's original proposal heading is historical; the brief58 agreement governs implementation. In particular, the client compares returned validated drafts for scene feedback, and no outcome object is required.

## Findings resolved

The reviewer independently reproduced implicit deletion through empty schedule values, negated clear instructions, a misleading price question after invalid capacity, and a claimed location removal that domain validation immediately restored from the business address. Backend corrected these boundaries and added regressions.

- Empty nested schedule values, blank category fields including whitespace, and empty payment selections cannot silently clear confirmed values.
- Explicit clears require affirmative field-specific evidence. Negated instructions and evidence naming a different field do not authorize deletion.
- Group failure questions identify the invalid member structurally. The implementation does not switch on validator error text. Price and capacity are independent when no category totals couple them.
- Proposed values and clears must remain represented after domain validation. Category-derived prices/quantities and address-derived locations cannot be announced changed when validation restores the old value.
- A focused partial answer remains pending when the same turn accepts another field and the provider omits pending evidence. A mixed new title/year regression covers retention across later history trimming.
- Missing reply or incomplete response envelopes are checked before application and remain safe provider errors. Invalid field proposals with a complete envelope use clarification responses.

## Invariants inspected

Incoming drafts and conversation state are parsed before provider access. State is versioned, field-allowlisted, bounded to12 facts,500 characters per fact and6000 UTF8 bytes. Client request byte accounting includes it. Pending overflow returns the prior state and prior accepted draft transactionally and states that the latest answer remains in chat rather than saved.

Every applied field needs an exact excerpt from user messages or retained raw facts. Evidence establishes provenance only; it cannot prove the model interpreted the utterance correctly. Group candidates still pass existing listing/setup validation. Invalid groups preserve old values while independent valid groups can succeed. No model-owned media, map pin, review approval, publication, account or payment mutation enters the listing. Ticket categories retain existing identifiers; new identifiers are server generated.

The browser persists draft, messages, pending context, confirmed scene progress and failed answers. A clarification-only returned draft does not increment saved scene feedback. Failed requests preserve the answer and require an explicit retry; the controller has no automatic paid retry. Manual edits and reset clear corresponding pending context. Existing local venue photos and pins are preserved through the client merge rules.

Claude remains server-only and gated. The model allowlist, Sonnet5.5 payload and existing output/request limits were inspected against PM's recorded model decision. No automatic fallback, provider retry or paid repair request was added. Same-origin checks and fixed safe provider error classification remain in place. Optional speech signs the actual returned reply.

## Evidence

Independent final command:

`node --test tests/conversation-patches.test.mjs tests/claude-ai-route.test.mjs tests/claude-ai.test.mjs tests/setup.test.mjs tests/chat-client.test.mjs tests/voice-conversation.test.mjs`

Result:115 passed,0 failed. The route tests invoke the actual handler with intercepted provider fetch. Domain tests cover valid and invalid field families, partial facts, mixed answers, explicit clears, category identity, derived totals, provenance, state limits and media preservation. Client/controller tests cover confirmed feedback, history byte trimming, pending state and explicit retry. A separate final probe confirmed that clearing an address-derived location preserves it and asks about the owning business address rather than claiming removal.

Source search found no remaining date-only helper caller or legacy whole-draft provider response schema in app/lib/tests. The deployment manifest includes the new lib modules through its existing directory traversal and excludes no required module.

This reviewer changed only this report. No server started, deployment performed, secret read, environment changed or paid request made. Browser desktop/mobile, build, release readiness and bounded live smoke evidence belong to PM. Mocked tests establish boundary behavior; they do not establish live model understanding, physical microphone quality or Fable availability. No model is guaranteed never to misunderstand. Conservative explicit-clear wording can require a follow-up question.

Actual role/skills read: backend role and shared workshop rules; brief-to-site; workshop-owner-language; architect; how; principle-model-the-domain; principle-type-system-discipline; principle-boundary-discipline; principle-fix-root-causes; principle-prove-it-works; unslop.

Decisions needed: none.

## Final provenance amendment review

Reviewed the final PM-approved contract amendment and actual source guard. `applyConversationAnswer` now constructs authorization evidence from the latest user utterance and retained unresolved facts only. Older resolved turns remain model reasoning context but do not authorize changes. The exact substring requirement remains in place. This closes replay over manual edits and repeated category creation without changing the browser contract.

Independently ran `node --test --test-name-pattern='^old resolved' tests/conversation-patches.test.mjs`:2 passed,0 failed. The regressions preserve a later manually edited price and prevent replay of an earlier category-add instruction. No new blocking finding.

The earlier115-test review run remains recorded above. PM separately reports90 final server tests,192 prior full-suite tests and36 frontend tests passed; those counts are PM evidence and were not independently rerun by this reviewer. The two targeted final provenance regressions were independently rerun after the amendment. Release browser and live smoke checks remain PM-owned.

## Provider compatibility correction

The initial review missed the provider's16-union structured-output limit; the original wide schema had31 unions. Earlier clean test results did not prove provider compatibility. The compact provider correction, actual14-union/0-optional count, decoder, pre-request/deployment guards and independent97-test run are reviewed separately in `backend/conversation-provider-review-v1.md`. Live provider acceptance still requires PM verification.
