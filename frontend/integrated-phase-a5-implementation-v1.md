# A5 storefront and staff frontend, implementation v1

Date: 2026-10-21. Source: `brief/project.json` v104, `contract/integrated-phase-a5-v2.md`, `handoffs/008-pm-a3-a5-agreement.md`.

Implemented a public stable-ID brand route at `/organizers/{organizerId}`. It reads the public profile and event summaries, renders an empty state for a brand without published events, paginates, and distinguishes missing brands from unavailable storage. Event cards use A4's `detailUrl` and `coverImageUrl` and label demo tickets.

Added `/dashboard/{organizerId}/storefront` for owner profile edits, with read-only access for staff, public preview link, server-projected permissions, dual-version PATCH and stale-data recovery. Image controls remain absent while public media delivery is gated. Added `/dashboard/{organizerId}/team` with real member/invitation projections, owner-only role/status changes, a disabled email form, private-link creation/copy/revoke, and independent pagination. Existing invitation links cannot be copied after reload. The public `/invite/{token}` page previews a link without consuming it, offers sign-in, accepts once, and preserves its idempotency key across uncertain retries. The dashboard now links to these pages.

All pages show loading, unavailable, and error states. New pages use existing Clear workspace colors and responsive layout. A5 feature gates remain server-controlled and off by default; the frontend makes no success claim while Clerk, Neon or the invitation secret are unconnected.

Validation: `pnpm run build` passed with elevated filesystem permission, including all new routes. The first sandboxed build was blocked by Windows junction creation for an existing PGlite dependency, before compilation. `pnpm run check` reached the full test suite but failed in long-running PGlite tests with a WASM abort; many earlier tests passed, including A5 gate and A1–A4 cases. That suite failure does not establish an A5 frontend defect. No connected browser-to-database walkthrough was possible with the gates off.

Limits: no email delivery, branding image selection, live payment, admission ticket, or connected invite acceptance was tested. Staff link creation and public storefront need connected-service verification before enabling their flags. The A5 backend's exact error envelope and rate-limit fields should be checked with Frontend during final integration.
