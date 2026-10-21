# Quick ticket creation and avatar verification v1

2026-10-18. PM integration record. Owner brief v31, pre-implementation contract scene-avatar-v3, approved violet/lime dimensional direction.

## Content and scene

The homepage now leads with “Create tickets. Skip the hassle.” Supporting text explains that a conversation prepares event details and ticket types for review. Navigation, entry, saved drafts, conversation and review controls use concrete ticket language. Payment and disconnected-publishing limits remain honest.

Each successful answer updates the world from confirmed facts and adds a bounded illustrated answer note. Title, location, calendar, clock, duration, ticket price and ticket types have distinct artwork. Guests retain stable positions and hold the chosen format. Notes can be expanded with touch or keyboard. Only the latest note appears on phones. Three recent notes can appear on desktop. Earlier confirmed facts remain in the world. Unsent or failed answers do not create accepted notes. A new draft clears the journal; camera appearance remains tab-local.

The host uses short local transitions and a restrained hover greeting. Reduced-motion rules preserve final content. Model inference runs in a worker so the conversation animation is not blocked by face detection. No frame-rate claim was measured.

## Camera and privacy

The deliberate bubble click begins expansion and requests camera access. With permission, the controller waits for one usable frame, captures it offscreen and stops tracks before analysis. There is no photo preview, displayed image, photo mask or stored portrait. Only the host receives visible styling colors, coarse hairstyle and bounded face proportions. Guests remain unchanged. No gender, age, ethnicity, identity, emotion or voice inference occurs.

Static pinned model/runtime files load from jsDelivr and Google's model storage. Pixels move only between the local page and its worker. No captured pixels are uploaded or saved. Worker, bitmap, pixel buffer and canvas are cleared/terminated. Permission decline, no face, model failure and Skip keep setup usable. A subsequent automatic reopen does not repeat the capture attempt within the same component lifetime; camera retry is explicit.

Actual browser verification used Google's public sample portrait, not the owner's camera. Model initialization passed. Real detection returned skinColor #e6af8d, hairColor #675e61, short hairstyle and bounded .988/1.012 face ratios. Canvas width became zero after analysis. Initial fixture errors in hair-band and clothing detection were corrected and rerun. This is approximate styling, not an exact portrait.

Bubble entry showed the camera-request status and Skip action. Skip cancelled personalization, and chat entry remained usable. PM did not grant physical camera access or capture the owner. Physical camera permissions, webcam-light behavior, device-specific frame readiness and physical mobile keyboard remain unverified.

## Checks

- Complete existing check sequence passed with 95 tests, 45 actual local PostgreSQL checks and isolated route rehearsal. All test provider requests were mocked.
- After hair refinements, all 16 avatar tests passed, including several-depth gray-hair sampling, rejection of skin/background patches, short hair beside dark clothing, continuous long side bands, no-face cases, cancellation, timeout and pixel disposal.
- All 11 scene-model tests passed after the final ticket-label correction. Final Next production build passed, with no development fixture route.
- Browser model initialization and actual public-image analysis passed. Repeated identical fixture answers added separate notes and stayed bounded. Tapping a note expanded it.
- Desktop and phone design reviews closed the mobile status/banner collision. Hover movement is gated to hover/fine-pointer devices.
- One real Claude request in the deployed app added Adult $15 / 12 places and Child $8 / 8 places while retaining capacity 20 and digital format. The picture added a new accepted-answer note and ticket-type artwork. No publishing or payment occurred.
- DOM inspection after that request found 20 visible guests, 2 desktop answer notes, zero photo/image nodes in the creation page and no visible video.
- The actual live test caught CSS motion overriding an extra ticket label's SVG positioning. A separate placement wrapper now keeps the label anchored beside its ticket. Multi-price labels explicitly say “From”.

The USD 10 total API allowance and provider configuration were unchanged. Exact billed amount was not inspected. No paid image or avatar API is used.

## Reproduction and artifacts

Run `node scripts/avatar-browser-fixture.mjs --install`, start the task-recorded local preview, then use /dev-avatar-check for model initialization and public-image analysis. It does not access a camera or make paid requests. Remove the fixture with `node scripts/avatar-browser-fixture.mjs` before building/deploying. The deployment manifest rejects an installed development fixture. Sources are preserved under frontend/fixtures/avatar and the public input is downloaded into ignored evidence only.

Related records: design/quick-tickets-v1.md; design/quick-tickets-review-v2.md; frontend/avatar-capture-v1.md; frontend/avatar-capture-review-v1.md and v2; frontend/answer-scene-v1.md; frontend/answer-scene-review-v1.md. The avatar report preserves exact pinned resource URLs, sizes, SHA-256 hashes, upstream license and approximation limits.

Final live screenshots are saved in the workspace root as ticketnest-quick-live-hero.jpg, ticketnest-quick-live-desktop-final.jpg and ticketnest-quick-live-mobile-final.jpg. The intermediate label correction is distinguished by final deployment and browser records in the brief.
