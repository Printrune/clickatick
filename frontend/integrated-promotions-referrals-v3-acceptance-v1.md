# Integrated promotions and referrals v3, Frontend acceptance

Date: 2026-10-21. Brief: `brief/project.json` v107. Reviewed `contract/integrated-promotions-referrals-v3.md` against `frontend/integrated-promotions-referrals-review-v1.md` and the current public event, quote and receipt components. This is prospective agreement. No application code changed.

**Frontend accepts v3 without further amendment.** It now requires code-validation errors to identify `promoCode` or `referralCode` in `fields[].path`, so the buyer form can put feedback beside the correct input. It also defines explicit 503 capability errors for nonempty codes sent while their respective feature is off, with deterministic priority if both are sent. Empty, missing, whitespace and null values canonicalize to no code. These resolve both requested changes.

The agreed frontend work is to add gated code inputs to the event page, prefill only referral attribution from `?ref=CODE`, submit both code keys in the quote body, display the server's original/discounted pricing and zero charge, handle `code_changed` and 409 `QUOTE_CHANGED` without remapping a selection, and show immutable pricing on new receipts while leaving old receipts readable. Organizer pages will use the private list/edit/activation DTOs and distinguish inactive editor drafts from owner activation. The browser will not calculate prices, claim a paid order, or show an earned commission.

`PROMOTIONS_DEMO_ENABLED` and `REFERRALS_DEMO_ENABLED` remain off, and both depend on the A6 published-revision write path. Contract acceptance does not verify the migration, connected services or buyer flow. Those checks are required before activation.
