# Conversation reliability verification v1

Brief: brief/project.json v58. Date: 2026-10-18. Owner requested a fundamental all-field repair after a relative-date answer paused voice. The date-only repair was tested locally but was not deployed after the owner broadened scope.

## Story

Ordinary spoken or typed answer → changed-field proposals → independent domain validation → retained accepted draft and partial facts → truthful spoken follow-up → continued listening. Reload and history trimming preserve unresolved facts and accepted draft values.

## Release acceptance matrix

| Case | Required result |
| --- | --- |
| Relative date without year/time | Keep raw pending phrase; ask one missing fact; do not save an invented year/time |
| Successive year and time answers | Retain earlier facts; complete valid schedule when grounded; continue voice |
| Several valid facts and one invalid field | Accept valid independent groups; preserve old invalid group; ask about rejected value |
| Prices, quantities, durations, timezone, type/format | Domain validation cannot stop an otherwise successful conversational turn |
| Multiple ticket categories and corrections | Preserve stable existing IDs; server assigns new IDs; accepted quantities remain coherent |
| Setup, locations, restrictions and referrals | Protect local media/pins and organiser review; never invent terms or claim connected commerce |
| Unchanged/null patch or omitted fields | Keep accepted values and manual edits |
| Explicit clear | Only allowed grounded clear; no implicit blank overwrite |
| Unsupported or malformed proposed values | Keep accepted draft; one truthful clarification; no automatic paid repair call |
| Missing provenance or invented facts | Reject ungrounded proposals; retain exact user evidence |
| Clarification only / mixed accepted and rejected answer | No false saved or checked raw-answer illustration note |
| History trimming and page reload | Pending facts and confirmed scene note survive; no reconstructed fake acceptance |
| Real network, credential, quota or service failure | Explicit error with draft and answer retained; manual Retry action only |

## Local evidence

- contract/conversation-patches-v1.md records Backend/Frontend/PM agreement and amendments before corresponding implementation. Model schema now proposes changed fields instead of regenerating a listing. The date-only helper was removed in the same wave.
- Full suite passed192 tests. Final server changes, including two later provenance regressions, passed90 focused tests. Frontend reported36 focused checks. Independent review passed115 combined checks plus the two final old-instruction replay regressions. These counts overlap and are not added together.
- Brief contract and isolated backend checks passed. Earlier in this task45 actual local PostgreSQL checks passed after the schedule validator extraction. Subsequent changes affect conversation processing and client state, not SQL.
- The real Workspace/controller ran in a labelled simulated speech/AI fixture. It accepted capacity50 from “50 guests and tickets cost bananas”, kept price unknown, stored one unresolved price fact, and spoke the price question without pausing.
- A page reload retained that pending price, capacity50 and confirmed scene note “50 guest places”. It did not mark the unclear price saved. Answering “25 dollars” resolved pending state and updated the scene from confirmed price only.
- A simulated503 kept the answer with Retry/Discard controls and did not make an automatic request. After another reload, explicit Retry made exactly one request, spoke the follow-up and returned to listening. No-change reply left accepted scene revision3 unchanged.
- Desktop and390x844 mobile screenshots captured at the isolated3032 local origin. Existing local and production drafts were not reset. Temporary viewport override was reset. Fixture screenshots: ../../../../../clickatick-conversation-reliability-desktop.jpg and ../../../../../clickatick-conversation-reliability-mobile.jpg.
- Only recorded task-owned preview sessions were stopped. The local fixture was removed before deployment manifest generation.

Production build, selected-model activation, live smoke and deployment readiness are pending. Physical audio quality remains separate from simulated recognition tests. Browser tools were occasionally slow during local database tests, but completed checks above use observed final states.

## Provider compatibility correction before live smoke

The first production build passed and deployment dpl_4ktSqKZ1amV2RqNePFt44oKcwnof became READY. Before making any paid smoke request, PM checked the current official structured-output limits and counted31 union-typed parameters in the wide nullable patch schema. Claude documents a16-union limit. The build and mocks had not established schema acceptance.

PM restored the previously verified deployment dpl_HTUG21BJYiHkzt94FLZdx7GUwtap. The first promote attempt was rejected by automatic approval review because the old deployment target was not sufficiently verified in that action context. PM gathered fresh deployment metadata and the recorded153-test/45-database-check release evidence, then the same restoration was approved. Alias resolution confirmed the restored deployment. No user approval was inferred and no permission protection was weakened.

The provider-only contract/conversation-patches-v2.md was agreed before the correction. A compact typed text/flags representation decodes to the same domain patch, with14 unions and0 optional parameters. Add a permanent schema-complexity preflight and regressions. The browser contract is unchanged, so the already observed client flows remain applicable. Independent provider review and a real smoke test remain required. No paid model request has occurred yet.

## Final release and real provider evidence

- Final compact schema/provider/route/domain/setup suite:97 passed,0 failed. Independent provider review also ran97 checks and enumerated14 unions/0 optional fields. Report: backend/conversation-provider-review-v1.md.
- Final production build passed; development fixture absent from routes and guarded60-file deployment manifest. The manifest now asserts provider schema limits before producing release files; the provider also checks before fetch.
- Existing AI_MODEL configuration was changed to claude-sonnet-5-5, preserving its production/preview targets. No private credential was read or changed. Existing prepaid USD10/no-refill conditions remain; no OpenAI/Fable activation.
- Deployment dpl_6eaMzwK57vtWq1XfKxcKWHxa38zz reached READY and both production aliases were assigned without alias errors. https://ticketnest-psi.vercel.app/ serves the final release.
- PM ran scripts/verify-live-conversation-v1.mjs --confirm-live. Three actual Claude requests passed, with no retries, purchases, top-ups or key reads. Evidence: evidence/live-conversation-v1.json.
- Real turn1 interpreted two days before Halloween this year at7pm as2026-10-29T19:00, correctly selected America/Phoenix, and retained20 places/USD15/90minutes/digital tickets from one answer.
- Real turn2 retained capacity20 when the user proposed minusfive, accepted independent USD12 and10percent referral settings, retained the schedule, and asked one capacity question. The bad capacity remained pending.
- Real turn3 accepted25 places, cleared that pending fact, and preserved price, schedule, location and referral settings. No validation error stopped the conversation.
- Fresh production browser displayed the existing saved draft and voice entry choices. No real microphone capture or extra paid request occurred in the browser. Live screenshot: ../../../../../clickatick-conversation-reliability-live.jpg.

Completion recorded in brief v59. Exact charged API cost is not exposed by the app response; no amount is invented. Mock tests establish failure recovery, live calls establish actual model interpretation for these cases, and simulated-audio browser checks establish the voice lifecycle. Physical microphone and device speech quality remain separate limits.

Model selection and price sources: research/conversation-model-v1.md. Existing USD10 total Claude allowance, prepaid account and no refills remain unchanged. No key is read or printed.
