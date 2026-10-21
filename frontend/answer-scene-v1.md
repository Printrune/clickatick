# Answer-driven illustration v1

Brief `brief/project.json`, version 31. Contract `contract/scene-avatar-v3.md` acknowledged before coding. Approved violet/lime dimensional direction preserved. Frontend specialist, 2026-10-18.

## Changes

Only the main host receives the optional appearance object. Skin and hair colors, hair silhouette, and bounded face proportions adapt. Guests keep their original appearance. The scene contains no photo, SVG image, portrait URL or camera preview.

The stable world now has an event-title banner, location sign, calendar, accurate clock hands, duration dial, price ticket and labeled ticket-type designs. Theme, audience and ticket format retain their existing meaningful props. Weekly days, individual dates and ticket-type prices come from the existing draft schema.

Each accepted revision with a nonempty answerNote creates a new illustrated answer ticket, including repeated answers and answers that add no structured field. The journal keeps the latest three notes, bounded to 120 characters each. Phone layouts show the newest note. Notes remain separate from confirmed draft facts. Clicking or keyboard-activating a note reveals its full excerpt. Existing crowd figures keep identity and floor positions.

| Before | After | Why |
| --- | --- | --- |
| Main host continuously stretched | Host stays grounded and gives one short greeting on hover | Response to interaction replaces perpetual movement |
| Time only appeared in a caption | Calendar and clock appear in the picture | Answers add specific illustrated details |
| Unmodeled answers left no trace | Each accepted answer adds a small ticket-shaped note | Every successful turn has visible feedback |
| Portrait image sat beside the host | Host appearance alone changes | No actual photograph is displayed |
| Scene updates used generic highlights | Changed props settle locally in 240–280 ms | Preserve spatial continuity and avoid animation backlog |

Appearance styling blends over 240 ms. Per-answer notes enter in 260 ms. Motion uses transform and opacity, with no React animation frame updates. Reduced motion preserves all facts and interactions without spatial animation.

## Files and evidence

- `components/EventScene.jsx`
- `components/ScenePerson.jsx`
- `lib/scene-model.mjs`
- `app/event-scene.css`
- `tests/scene-model.test.mjs`
- `frontend/answer-scene-skills-v1.json` records actual skill paths and hashes.

Read frontend role, shared rules, local AGENTS.md/README.md, approved direction and illustration/motion skills. Read bundled Next.js use-client documentation before implementation.

`node --test tests/scene-model.test.mjs`: 11 passed, 0 failed. Checks cover confirmed cues, stable crowds, formats, times, calendar/weekly days, type prices, bounded note history, revision deduplication, repeated answers and safe appearance fallbacks.

## Integration and review gaps

PM owns Workspace wiring, copy, browser verification, full build and deployment. Pass appearance, accepted revision and accepted answerNote. Clear the journal on new-draft identity by remounting the scene or resetting revision as agreed. Do not increment for unsent text or request failures.

The mobile journal needs 44 pixels in the scene allocation. Actual responsive screenshots, interaction smoothness and camera feature extraction remain to be reviewed by PM and Designer. No browser, external AI, camera, model download or deployment was executed by this specialist.

No owner decision is needed for this refinement.
