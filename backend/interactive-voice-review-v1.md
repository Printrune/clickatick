# Interactive voice prompt review v1

Brief: `brief/project.json` version 33. Contract: `contract/voice-conversation-v1.md`. Backend agreed the unchanged request, response, canonical listing schema and file ownership with the Product Manager before coding.

## Change

`app/api/chat/route.js` changes only the assistant system prompt. Replies now use one or two short plain-text sentences. The assistant briefly acknowledges useful answers and ends with one focused missing-detail question. It accepts several supplied facts in an answer and uses the current draft rather than restarting intake. Once necessary details are complete, it offers review or edits.

Existing instructions still protect manual edits, ticket identifiers, explicit ticket formats, unknown values, untrusted event data and the event-only role. The prompt does not discuss avatar, microphone or camera mechanics. No provider, model, schema, environment, credential, budget, publication or persistence code changed.

The frontend owns speaking, listening, automatic final-answer submission, cancellation, status and run bounds. This prompt refinement alone does not implement those controls.

## Evidence

`tests/claude-ai-route.test.mjs` now inspects the actual mocked provider request. It verifies the spoken-friendly instructions, focused-question and completion-review guidance, preserved role/manual-edit/identifier constraints, and unchanged user message. The existing route origin, input-role, disabled-service and output assertions remain.

Run from the starter folder:

```text
node --test tests/claude-ai-route.test.mjs tests/claude-ai.test.mjs
45 tests passed, 0 failed, 0 skipped.
```

Every provider request was intercepted by the tests. No live AI calls, deployment, microphone, camera or browser actions occurred. These checks verify prompt delivery and route safety; they do not prove the model always follows the conversational instructions. PM must verify the integrated spoken flow and record physical-device limits honestly.

## Instructions read

- `team/roles/backend.md`
- `team/shared-rules-v1.md`, the preserved adaptation of the kit shared rules. No `CLAUDE.md` was found in the extracted product-team tree.
- `AGENTS.md`, `README.md`, `lib/brief.mjs`
- `../skills/brief-to-site/SKILL.md`
- `.agents/skills/workshop-owner-language/SKILL.md`
- Installed `pstack-plugin/0.2.0/skills/unslop/SKILL.md`
- Installed `vercel/0.54.1/skills/ai-sdk/SKILL.md`. No SDK migration or provider setup applies to this prompt-only task; the explicit unchanged-provider instruction takes precedence.
- Version-matched Next.js `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`

## Decisions needed

None. Existing approval covers this refinement. No new service or spending permission is required.
