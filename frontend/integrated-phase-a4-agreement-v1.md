# Frontend agreement — integrated Phase A4 v2

Date: 2026-10-21. Reviewed `brief/project.json` v98 and `contract/integrated-phase-a4-v2.md` against `frontend/integrated-phase-a4-review-v1.md`. No A4 app code was changed.

**Frontend agrees with the revised A4 interface and ownership.** V2 resolves all six frontend amendments: exact `{data,error}` projections and field paths; section-scoped seat pages and tier compatibility; a reloadable quote read with explicit state; immutable seat labels and unassigned quantities; a default-off, separate Neon catalog section; and actionable retry/conflict/media fallback states. The idempotency rule correctly allows a lost checkout response to replay its committed receipt after cancellation.

The new `/events/{id}`, `/events/{id}/demo-checkout?quote={quoteId}`, and `/demo/receipts/{id}` routes can be implemented without changing the existing `/listing/{id}` and `/receipt/{id}` routes. The marketplace and discover page must retain legacy Blob cards and counts while the Neon section is off. When enabled after connected verification, the Neon section remains separately labelled and has no global-search claim. The event and receipt pages must consistently say that prices are illustrative, the amount charged is zero, and no seat reservation or admission ticket exists. Accessible seats remain selectable by every guest.

No remaining Frontend/Backend interface blocker. The agreed implementation order is owner review/publish/cancel states; public detail and section-filtered keyboard seat selection; quote read and zero-charge checkout; shareable receipt; then guarded catalog section and connected browser/API/data verification.

**Release gates remain:** PM must record exact anonymous demo quotas, receipt share retention, and A3 private-media quotas. Required venue photos mean successful publication cannot be claimed while A3 upload is gated. The catalog flag remains off until the full connected path and cancellation/mobile/keyboard cases pass. These are owner/product gates, not unresolved interface mismatches. PM asks one owner question at a time.
