# Persistent bubble and conversation rebuild v1

Date: 2026-10-18. Frontend specialist. Brief: `brief/project.json`, version 29. Contract: `contract/scene-workspace-v2.md`, acknowledged before implementation.

## Implemented

- One persistent `.idea-surface` remains mounted from the thought trigger through choice and conversation. Its actual hero anchor and destination are measured. Web Animations API transforms connect those geometries, with 420 ms expansion and 260 ms reversal. The curve is `cubic-bezier(0.23, 1, 0.32, 1)`. Interruption captures the visible intermediate geometry before cancelling the previous animation. Keyboard entry, keyboard dismissal and reduced motion use an immediate state change. Choosing chat or voice changes content inside the same expanded bubble.
- The expanded bubble is opaque. Desktop uses a larger scene beside conversation. The mobile scene remains above a bounded conversation, with the composer outside the scrolling message log. The page uses the visual viewport height, with a shorter scene when the browser keyboard reduces available space.
- Scene activity is idle, listening, thinking or speaking. The revision increments after accepted AI drafts and manual changes. The existing canonical draft passes unchanged to EventScene. The scene specialist owns illustration behavior.
- The restored conversation scrolls to its latest reply when reopened. Errors appear beside the composer and in review, with a complete dark error color treatment. Failed sends preserve the previous draft and restore the submitted text.
- Voice availability appears before entry. Recognition shows interim words in the editable composer. Listening is explicit; the user reviews and sends the transcript. Spoken replies have a stop action and set the scene speaking state. Browser microphone and speech output remain user controlled.
- Review and manual editing occupy the conversation side of the same bubble. The scene remains visible. The generic ticket cover has been removed from ListingPreview. Ticket types, schedule editing, downloads, login and publication actions retain their existing data contracts.
- Saved drafts have an explicit continuation label and a new-idea action. Reset requires inline confirmation, offers a download, clears the previous ID, and is disabled while a request runs.
- Focus moves into the expanded bubble, cycles within it, and returns to the thought trigger on close. Escape closes review first, then the bubble. Background navigation and footer become inert. The optional camera uses a native modal dialog, stops camera tracks, offers retake and remove, and describes its photo as a host photo rather than claiming an inferred character appearance. Photos stay in tab memory.
- Mobile copy and controls are larger, message surfaces share the dark palette, progress metadata wraps, and hover motion is gated to fine pointers.

## Files owned

`components/Workspace.jsx`, `components/IdeaEntry.jsx`, `components/CameraPortrait.jsx`, `components/ListingPreview.jsx`, `app/bubble.css`.

## Verification

Production build passed outside the filesystem sandbox. Next.js compiled and generated all 11 static pages and server routes. The first build attempt hit the known Windows sandbox path-canonicalization access error; the escalated retry succeeded. The following small source changes were made after that compile: visual viewport short-height CSS and immediate chat-choice focus. PM should include these in final build verification.

No preview process, deployment, live model request, microphone capture, camera capture or browser session was started by this specialist. PM owns browser screenshots and final rendered verification. Physical-device keyboard behavior, speech recognition, camera permissions and animation feel remain runtime checks. Voice is reviewed dictation with optional spoken replies, not an automatic always-listening call. No claims of measured frame rate or accessibility conformance.

The frontend change does not connect hosted login, persistence or publishing. The existing USD 10 AI demonstration allowance and provider configuration remain unchanged. Opening, closing, restoring, choosing an input mode and editing fields make no AI requests. A real model request still requires an explicit Send action.

## Loaded instructions and skills

Read current brief, project AGENTS.md and README, team shared rules and frontend role, scene-workspace v2 contract, current audit, selected design specification, Next.js bundled use-client documentation. Read frontend-design, intentional-ui-design, illustration-design-grammar, animate, emil-design-eng, yc-interface-craft with system-and-surfaces and motion-and-quality references, workshop-owner-language, and pstack unslop. Earlier approved direction is preserved; no new visual exploration or marketing work.

## Pending review

PM and Designer must review desktop, mobile, error, keyboard, reduced-motion, saved draft and scene-update states. No owner decision is needed for this implementation.
