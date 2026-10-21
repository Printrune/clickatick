# A3 media v4 frontend, implementation v1

Date: 2026-10-21. Source: `brief/project.json` v104, `contract/integrated-phase-a3-media-v4.md`, and `handoffs/008-pm-a3-a5-agreement.md`.

Added `/dashboard/{organizerId}/media` and an event-editor media panel. They read brand assets, server capabilities, usage and estimated shared space. The list includes ready, pending, verifying, failed and deleting states as returned by the server. It shows verification errors, reference locations, explicit delete confirmation, list pagination, and clear unavailable/unknown-storage states. The dashboard links to the library.

The new upload control is private MP4 only. It bounds the selected source file at 100,000,000 bytes, requests an idempotent reserved intent, transfers with `@vercel/blob/client`, shows transfer progress, and polls the status route until ready or failed. It never treats a browser transfer result as a verified upload or public event attachment. Upload remains disabled unless `MediaCapabilities.videoUploadEnabled` is true. Public video playback is absent.

**Image upload is still gated.** The old 2 MiB multipart image control is closed even if its prior public flag is set; existing draft images can still be detached. The approved 10 MB image source limit requires a direct client upload path to avoid the Function body limit. PM is drafting an A3 v5 amendment for this exact interface. Until it and Backend implementation are agreed, image normalization, metadata stripping, recovery, attachment and the 5 MB output check cannot be claimed complete. The original device image remains untouched.

Validation: elevated `pnpm run build` passed and included the new media route. No Blob, Clerk or Neon service was activated. The A3 v4 upload/status routes are not yet present in this checkout, so browser-to-storage verification remains pending and server capabilities must stay disabled. The prior full `pnpm run check` run failed in long-running PGlite WASM tests; this media slice has not had a separate connected functional test.
