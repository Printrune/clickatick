# Local avatar capture v1

Frontend specialist, brief/project.json v31, contract/scene-avatar-v3.md agreed before coding. 2026-10-18.

## Implementation

- `components/CameraPortrait.jsx` exposes `request()` and `cancel()` through React ref. Call request directly from the bubble click. Only the first automatic request occurs during this component lifetime; the camera button explicitly retries.
- Permission refusal, unsupported camera, no face, model failure and cancellation never block ticket creation. Status callbacks are `{state,message}` with idle, requesting, capturing, analyzing, ready, denied, unavailable, no-face, cancelled.
- A hidden muted video receives the camera stream. No photograph or camera preview is rendered. One usable frame is drawn to a detached canvas. Tracks stop immediately before model analysis. Closing, retrying and unmounting stop current tracks. A late permission resolution after cancellation also stops its tracks.
- `lib/avatar-client.mjs` creates a bounded classic worker. Every completion, failure, cancellation or 25-second model timeout terminates it. A five-second frame timeout releases a stalled camera. Browser permission prompts themselves cannot be cancelled by web code; late streams are stopped.
- `public/avatar-worker.js` loads a pinned official MediaPipe Tasks Vision build and versioned Google Face Landmarker model. Detection runs in CPU IMAGE mode with one face, no blendshape or transformation-matrix output. Classic worker is deliberate because the official WASM loader uses importScripts. Native dynamic import loads the fixed ESM bundle; no eval or injected executable strings.
- `lib/avatar-features.mjs` uses actual detected face landmarks, face-anchored cheek/forehead pixel patches, and a narrow band above the forehead. Output contains only skin/hair styling colors, coarse short/long/cropped hairstyle, and bounded face proportions. No demographic or identity classification.
- Pixels, bitmap, canvas and worker resources are discarded. Appearance is passed to the parent for tab memory only. No image upload, browser storage, provider request, photo element or microphone access.
- Parent owns the compact status strip. CameraPortrait renders only the hidden video and explicit retry camera icon.

## Verification

`node --test tests/avatar.test.mjs`: 11 passed. Covers bounded appearance, empty/tiny/clipped faces, transparent patches, malformed input, worker readiness, timeout, cancellation, no-face errors, creation failure and pixel/canvas purging. `node --check lib/avatar-client.mjs` and worker syntax passed.

Tests use synthetic fixture pixels and mocked workers, not a webcam. PM owns actual browser initialization, upstream sample-image detection, integrated build and deployment. Device permission denial/capture/track-light behavior is not physically tested by this specialist. Controller lifetime paths were source-reviewed, not claimed as real-device success.

## Resources and licenses

Library package pinned by PM: `@mediapipe/tasks-vision@0.10.32`, Apache-2.0. Runtime resources are static cross-origin GET downloads only. Camera pixels are never included. First use downloads about 15.5 MB with SIMD; browser caching may reduce later transfers. No local model binaries added.

Root URL: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/`

| Resource | Bytes | SHA-256 verified from public GET |
| --- | ---: | --- |
| vision_bundle.mjs | 137160 | de83c48ff329717a27aeb528d5ef5f47f077c628a5302dc483aca5b513e7464b |
| wasm/vision_wasm_internal.js | 204816 | 6f6b86509cf9e163ea1cfec7edc8cf53732699c04781e4c21c557c1ba402310e |
| wasm/vision_wasm_internal.wasm | 11453626 | cb3ec20026a9aecc2a81a93c25630ceb5389297ddb7a5f0bd61dd09cde606b9b |
| wasm/vision_wasm_nosimd_internal.js | 204669 | 9f8fc960e363f0fb2f42f7937b97ae9cf9a5630490f71031fa90caa9bb121938 |
| wasm/vision_wasm_nosimd_internal.wasm | 10647962 | 924274fcd5ac8985f6570a8573e7971b7bd2d580ba1b8f3beb0ba8f95db6347c |

Model: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, 3758596 bytes, SHA-256 `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.

Preserved upstream Apache license at public/mediapipe-LICENSE.txt, SHA-256 `8707eef0533987efc5b155d64761eeb6e20793f50b9bd1a68dad1cf4719d0ed8`. Retrieved from https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/LICENSE . The Face Mesh V2 model card also identifies Apache2.0: https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf . Resource hashes record inspected artifacts; they are not runtime SRI enforcement.

Official implementation guidance: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js . Camera lifecycle guidance: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia .

## Limits

A stylized approximation, not an exact portrait. Lighting, hair/background similarity, hats, face angle, occlusion and camera color balance affect colors and hairstyle. Hair sampling does not perform semantic hair segmentation. Face presence detection precedes feature extraction, so missing faces do not turn whole-frame colors into an avatar. Only the host receives this appearance through the agreed scene contract. No gender, age, ethnicity, identity, emotion or voice inference.

Static model resources must be reachable. Unsupported worker/bitmap/browser/WASM capabilities preserve the existing character. Cold model load can take several seconds; ticket conversation stays available. Browsers control permission prompting and may reuse previous permission.

## Skills read

Frontend role and shared rules; starter AGENTS.md and README; frontend-design; yc-interface-craft and selected motion/system/research/direction references; intentional-ui-design; emil-design-eng and animation-performance; workshop-owner-language; pstack unslop; installed Next.js16.4.2 use-client docs. Existing approved direction preserved. No new visual exploration, browser camera access, AI spend, server/API changes or deployment performed.

Decisions needed: none. PM review and actual browser/runtime verification remain.
