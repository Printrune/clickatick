# Creator-to-Neon cutover backend implementation v1

Scope: agreed `contract/creator-neon-cutover-v2.md`, handoff 014, brief v105 (subsequent v106 fee decision does not change this interface). This is code preparation, not activation or a connected-service claim.

## Implemented

- Added one server-only, default-off `CREATOR_NEON_CUTOVER_ENABLED` gate. Only the literal value `true` enables it.
- When enabled, the old anonymous demo publish and checkout, artwork generation, marketing save/revoke/refine/approve, Supabase/local publishing, and OTP/local auth mutations return HTTP 410 before request parsing or any service call. The response is `{error:'Save this draft to a brand to publish it after review.',code:'LEGACY_PUBLISHING_CLOSED',saveDraftUrl:'/dashboard?source=creator'}` with `Cache-Control: no-store`.
- Historical listing/receipt reads and authorized marketing GET are unchanged. Clerk sign-out is separate from the closed legacy auth DELETE route.
- Documented the default-off flag in `.env.example`. No environment was changed, no deployment was made, and the cutover is not enabled.

## Verification

`node --test tests/creator-neon-cutover-backend.test.mjs tests/demo-publishing.test.mjs tests/marketing.test.mjs tests/event-artwork.test.mjs tests/claude-ai-route.test.mjs`: 53 passed. The new focused tests call every gated mutation with no usable request, demonstrating early 410 without body parsing or a service call. Existing legacy behavior tests pass with the gate off.

## Remaining activation work

- Frontend creator handoff, owner brand selection, and marketplace cutover must be integrated and checked end to end with connected Clerk and Neon before setting this flag to `true`.
- Old Supabase/local writer code and configuration remain in the disabled branch to preserve the agreed default-off rollback behavior. Remove them in a later cleanup after cutover verification and rollback decision; deleting them now would silently change gate-off behavior. `lib/services.js` also supplies shared AI/speech and same-origin helpers, so it cannot be removed wholesale.
- No real payment, admission ticket, or live AI service was verified by this slice.
