# Scene, capture and answer interface v3

Brief v31, 2026-10-18. Agreed frontend-only plan before implementation. Existing listing and backend schemas stay unchanged.

## Avatar

Replace portrait URLs throughout the frontend with `appearance`, an optional tab-memory object: `{skinColor: '#rrggbb', hairColor: '#rrggbb', hairStyle: 'short'|'long'|'cropped', faceWidth: number, faceHeight: number}`. Ratios clamp to 0.85–1.15. Fields describe visible styling only. No gender, age, ethnicity, identity, emotion or voice inference. Neutral defaults remain safe.

Local analyzer uses a pinned official MediaPipe Face Landmarker and local pixel sampling. It accepts a single in-memory canvas, returns appearance or a typed no-face/unavailable error, closes model resources when appropriate, and never uploads or persists the image. A bounded worker is preferred so analysis does not block bubble/chat animation. No external LLM or paid API for capture. Model downloads are static resources; input pixels stay local. Preserve third-party licenses and record exact version/model URLs and hashes. Do not claim a perfect likeness from color/proportion approximation.

`CameraPortrait` is replaced in place with an imperative controller via React ref: `request()` begins one capture after the bubble click; `cancel()` stops tracks and cancels pending analysis. Props `{appearance, onAppearance, onStatus}`. It may show a small permission/status panel and retry action, but no video/image preview and no image element. A hidden muted playsInline video can receive the stream. Camera is requested only through deliberate entry/retry action. After permission, wait for a usable frame, capture once, immediately stop tracks, analyze locally, discard canvas pixels and pass appearance. Closing cancels safely. Permission refusal/no face/unsupported device preserve neutral avatar and never block the conversation. Do not prompt again each reopening within a tab after declined or completed capture; retry is explicit.

`EventScene` accepts `{draft, appearance, compact, activity, revision, answerNote}`. `appearance` reaches only the main host. `answerNote` is the latest successfully submitted user answer, never unsubmitted input or an error response. It is text-only, bounded to 120 characters and rendered safely. Every revision adds/updates a small illustrated answer tile within a bounded visual journal, including when no modeled fact changes. Specific confirmed fields gain actual illustrated props or signs, not just a generic flash. Existing objects remain stable. Theme, capacity, ticket format, title, location, schedule, duration, price and ticket-type changes get distinct picture details. Avoid invented event facts. Changes animate locally and retain information with reduced motion.

## Ownership

- Avatar frontend: components/CameraPortrait.jsx; new lib/avatar-features.mjs, lib/avatar-client.mjs, worker if needed; avatar tests; assets/package inputs only after PM agreement. Output frontend/avatar-capture-v1.md.
- Scene frontend: components/EventScene.jsx, ScenePerson.jsx, app/event-scene.css, lib/scene-model.mjs and scene tests. Output frontend/answer-scene-v1.md.
- PM: Workspace integration, IdeaEntry and copy, bubble CSS, shared brief, browser/build/deployment evidence.
- Designer: versioned copy/motion review and actual screenshots, no shared implementation edits.

Keep the approved violet/lime dimensional direction. No new visual exploration, marketing campaign, payment changes or hosted publishing claims.
