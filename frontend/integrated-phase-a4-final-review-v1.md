# Frontend A4 final contract review v1

Date: 2026-10-21. Checked against `brief/project.json` v104, `contract/integrated-phase-a4-v2.md`, the implemented A4 routes/services, and the Frontend pages. This review does not activate the public catalog or connect services.

## Result

The A4 frontend and backend agree on the implemented route paths and response envelopes. Catalog and detail return `{data:{events,...}}` and `{data:{event}}`; section-scoped seats return `{data:{seats,nextCursor}}`; quote read returns `{data:{quote,state}}`; quote/checkout return their contracted URLs; receipt read returns `{data:{receipt}}`. The frontend uses those fields. The `QUOTE_ALREADY_USED` error initially lacked the agreed `receiptUrl`; Backend repaired the error envelope and I verified the source. No interface change was needed.

I repaired `.env.example` so the catalog comment and `NEXT_PUBLIC_NEON_DEMO_CATALOG_ENABLED=false` are separate lines. I also bound publish retry keys to the draft version and cancellation retry keys to the exact version and reason. This preserves safe same-body retries without reusing a key for changed details. The owner cancellation button appears only for an owner role; the server still enforces that role.

## Error and release behavior

- Publish shows server field errors and keeps unsaved form changes from being silently skipped. A stale/published draft reloads or exposes the public URL.
- Public event detail renders readable copy when an image fails; ticket capacity and seats are labelled as configured, not available or reserved.
- Checkout reloads its no-PII quote, gives recovery navigation for expired/cancelled/stale states, and shows a link to an existing confirmation on `QUOTE_ALREADY_USED`.
- Receipt shows current cancellation status while keeping the original illustrative ticket details. No payment, reservation, admission credential or refund is claimed.
- The new Neon catalog section defaults off. Existing Blob listing routes remain usable and separate. A4 demo quote/checkout remains unavailable until its server gate and connected-service checks are complete.

## Evidence and remaining limits

`node --test tests/integrated-phase-a4.test.mjs` passed 6/6. The integrated production `next build` passed after the final changes. `.env.example` was read back and no literal backtick-newline sequence remains. This does not prove a browser journey: Clerk, Neon and private Blob are not connected in this local review, and the public catalog flag is off. The prior broad test suite had an unresolved PGlite failure; this focused pass does not erase that result. A connected browser/API/data walk, mobile and keyboard checks remain necessary before enabling the new catalog or claiming a complete public flow.

Brief v104's eventual real-platform destination and published-listing edit policy belong to later phases. A4 still implements a zero-charge demo path only.
