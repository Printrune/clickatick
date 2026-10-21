# Event artwork and bot roster review v1

Brief: `brief/project.json` v78. Interface: `contract/event-artwork-v2.md`.

Production deployment `dpl_2FccS6zfUWUUzXud4rHm9umXRSPN` is READY and aliased to `https://ticketnest-psi.vercel.app/`. The light-mode ticket pattern is visible on the live desktop home page. Local browser checks matched the captured JPEG to the reviewed SVG scene and showed a responsive bot roster with seven distinct avatars and three custom-agent previews. The bot roster was checked in a temporary local fixture and the fixture and preview process were removed afterward. Creator-only bot controls remain inert previews.

The full local suite passed: 263 tests, zero failures. `pnpm install --frozen-lockfile` and the Next production build passed after explicitly approving `sharp` in `pnpm-workspace.yaml`. The first attempted deployment failed at install because that approval was missing; the second deployment passed.

Saved scene images are included in new immutable demo listings and projected to their on-page and saved demo confirmations. Old listings have no image and continue to render. Realistic generation is creator-initiated, guarded by a fresh positive Gateway-credit check and 20 global create-only attempt slots. The production gate remains off because the current Gateway credit has not been confirmed. No live image-provider call was made, so generated-image quality and Gateway authentication have not yet been verified in production. No original camera frame is uploaded; only the illustration is saved. Demo confirmations remain invalid for admission.
