# Frontend agreement: A3 media v4 and A5 storefront/staff v2

Date: 2026-10-21. Reviewed against `brief/project.json` v104, `frontend/integrated-phase-a3-media-v3-review.md`, and `frontend/integrated-phase-a5-contract-review-v1.md`. Both contracts remain prospective; this review changes no application code or connected service.

**A3 media v4: agreed.** The v4 amendments resolve the five frontend issues: exact reservation-sized upload tokens and completion checks; recoverable in-progress/failed assets in the list; complete usage, capability, asset and error projections; explicit private-only meaning of unassigned event videos; and server-controlled image/video/playback capabilities. Implement v4 where the older v3 body differs. Keep uploads and public video playback gated until the PM handoff and the connected store, callback, accounting and range checks pass. A3 UI must not claim an uploaded video is attached to an event or publicly playable.

**A5 storefront/staff v2: agreed.** The v2 amendments resolve the five frontend issues: owner permissions on the storefront read; dual-version conflict payload; opaque membership UUID and safe label; separate member/invitation pagination with restricted non-owner projection; and precise invite recovery, replay and error states. Implement v2 where v1 differs. A created invitation cannot be copied again after reload because the list does not recover its URL. Email sending and branding media remain gated as specified. The public brand URL uses the stable organizer UUID.

There is no frontend interface blocker to the agreed implementation slices. Agreement is to these prospective DTOs and states, not evidence that Clerk, Neon, Blob, invitation delivery, or public media playback works in a connected environment.
