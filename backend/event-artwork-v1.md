# Event artwork backend handoff v1

Brief: `brief/project.json` v77. Agreed prospective interface: `contract/event-artwork-v2.md` (inherits v1). The Product Manager and Frontend agreed the public listing, checkout response, and confirmation `coverImage` shapes before this implementation.

## Implemented

- `lib/listing.mjs` accepts optional immutable `draft.coverImage` `{mime:'image/jpeg',dataUrl,origin:'scene'}`. It validates exact keys, base64 canonical form, JPEG markers, character length, and decoded size. The validator runs in browser and Node without `Buffer`. Listings without this field retain their old digest and record shape.
- `lib/demo-service.mjs` exposes active top-level `coverImage` on public listing reads, checkout responses, and saved confirmation reads. A generated overlay takes priority over the scene; missing overlay falls back to scene, then `null`. The stored receipt schema and immutable listing record do not change.
- `lib/event-artwork.mjs` authorizes through the existing creator capability, checks `EVENT_ARTWORK_GATEWAY_ENABLED=true`, `EVENT_ARTWORK_CREDIT_CONFIRMED=true`, and a Gateway credential, then calls the read-only `/v1/credits` endpoint. Unknown or zero credit fails closed. It atomically claims one request per listing before provider execution; a saved result replays without another call. Failed/uncertain calls consume the attempt and retain the original scene.
- The provider adapter uses the official Vercel AI SDK 7 `generateImage` call with `bfl/flux-3-image-klein`, which supports reference images, and passes the scene JPEG when available. The prompt contains bounded public event facts, never an original camera frame or creator token. The output is converted to a bounded JPEG with `sharp`, validated, and stored as a separate private Blob overlay.
- `app/api/demo/listings/[id]/artwork/route.js` checks same origin, creator cookie, bounded JSON, and private no-store response headers.
- `package.json`/lockfile add `ai` and `sharp`.

## Verification

`evidence/event-artwork-backend-tests-v1.txt`: 25 focused tests passed, including real route guards, publish/checkout compatibility, scene fallback, receipt projection, one provider attempt, replay, zero-credit refusal, and malformed image rejection. `sharp` loads locally despite pnpm's ignored-build warning.

Official provider evidence: [Vercel FLUX 3 Image Klein](https://vercel.com/ai-gateway/models/flux-3-image-klein) documents generation, editing, references, and listed $0.009/image; [Vercel FLUX 3 Image SDK example](https://vercel.com/changelog/flux-3-image-now-available-on-ai-gateway) documents the `{text,images}` prompt form. [Gateway REST reference](https://vercel.com/docs/ai-gateway/sdks-and-apis/rest-api) documents the read-only credit balance endpoint.

## Limits and activation

No live provider request was made. The Gateway gate is disabled by default, and prior balance evidence was zero. Code verification does not establish that this model is available to the owner's team, that the runtime credential is configured, or that image generation succeeds on Vercel. Until credit is confirmed and the server flag is enabled, the scene JPEG remains the active cover. One attempt per listing protects against retry spending; it cannot recover an uncertain provider result.
