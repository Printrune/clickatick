# Front-page setup contract v2

Supersedes v1 for one additive field. Brief v52; PM requested refinement on 2026-10-18. Frontend confirmed the additive field before implementation.

`setup.refundPolicy` is an editable string, max4000 characters. Defaults empty both for old listings and old setup objects without the field. `draft.setupPatch.refundPolicy` is string or null. Null preserves the previous value. Only explicit organiser wording may populate it through conversation. No automatic legal approval or refund enforcement is implied.

This field is shown separately from restrictions and disclaimer. Suggested wording is clearly a draft. No payment, refund or purchase service is implemented.

Other v1 clarifications: AI uses nullable setupPatch rather than repeating whole setup. Coordinate pair clears when corresponding address changes. Venue photo remains local. Matching disclaimer text preserves review; changed text resets it. Allocated remains default inventory. All configured extended setup is gated from publication to avoid unsupported persistence semantics.

Referral preview rounds platform and referral amounts to cents, then caps referral to the remaining business share to conserve the ticket price at small values. Processing fees excluded.

