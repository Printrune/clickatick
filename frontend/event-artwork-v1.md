# Event artwork frontend handoff v1

Brief: `brief/project.json` v77. Interface: `contract/event-artwork-v2.md`, accepted by Frontend and Backend before edits. Scope: browser capture, listing and demo confirmation images, explicit creator generation control. The existing purple direction and demo boundaries remain.

## Changes

- `lib/scene-cover-client.mjs` serializes the reviewed SVG scene, inlines its computed paint and motion styles, paints a JPEG, and reduces quality/size until it meets the agreed bounds. It only reads the drawn scene. No camera frame, image file, chat text, or private token enters the cover.
- `components/Workspace.jsx` captures once before demo publication, stores the image with the draft and the same publication intent before POST, and reuses those bytes on a retry. Content edits clear the cached cover so the next publication captures the revised scene. If capture fails, publication proceeds without artwork.
- `components/ListingPreview.jsx` and the published listing route display the active public image above ticket facts. Existing venue photos remain in the setup details.
- `components/DemoCheckout.jsx`, `components/DemoReceipt.jsx`, and the saved receipt route carry the same active public image into the demo confirmation. The prominent invalid-for-admission label is always shown. Printing retains the image and label.
- `components/CreatorPromotionPanel.jsx` adds an explicit `Generate realistic image` button. It persists one request ID per listing, calls the creator-protected API only on click, and reloads after success. An unavailable or failed provider leaves the illustrated cover in place. No automatic generation is triggered.
- `app/demo-publishing.css` styles the listing cover, ticket image, invalidity label, and creator action in the existing visual system.
- `app/theme.css` adds a slow, faint repeating ticket outline to the light front-page background. The pattern is behind content, has no pointer interaction, and stops for reduced motion. An orphan selector before the review border rule was removed.

## Checks and limits

- Final Next.js production build passed with the artwork API route and without the temporary inspection route. The restricted build first failed at a PGlite junction with `Access is denied`, before compilation; this is the known sandbox behavior.
- `node --test --test-concurrency=1 tests/event-artwork.test.mjs tests/publish-intent.test.mjs tests/demo-publishing.test.mjs` completed 31 passing checks.
- `git diff --check` passed. The root project is historically untracked, so Git reports no file diff.
- Browser inspection compared the live SVG scene and captured JPEG side by side. Color, crowd, date card, guide, and ticket props were retained: `evidence/event-artwork-capture-v1.png`. The temporary test route was removed afterward.
- A 390px light-mode browser screenshot confirmed the ticket pattern stays behind legible text and the CTA: `evidence/light-ticket-pattern-mobile-v1.png`. The explicit viewport override was reset, tabs closed, and the recorded local preview stopped.
- End-to-end public image publication and optional Gateway generation still need a deployed creator publication. The Gateway call remains disabled until credit is confirmed and its server flag enabled.
- The downloadable confirmation JSON remains the existing receipt schema. The on-screen and print confirmation display the image.
- The shared `parseListing` image validator briefly used Node `Buffer` inside browser code. Backend changed it to browser-safe base64 decoding before the final build.

Skills/documents read for this step: `team/roles/frontend.md`, `team/shared-rules-v1.md`, `starter/AGENTS.md`, `starter/README.md`, `frontend-design`, `intentional-ui-design`, `illustration-design-grammar`, `emil-design-eng`, `workshop-owner-language`, `typescript-best-practices`, `unslop`, and bundled Next.js server/client and image guides.
