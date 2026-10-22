# Connected private media verification

Date: 2026-10-22. Brief read: `brief/project.json` v108. This records connected evidence after `preview-blob-reconciliation-v1.md`; the v1 handoff was prospective.

Vercel project `clickatick` has a dedicated private organizer-media store, `store_z2R3u4hf3W2JXwwI`. The legacy demo store remains `store_yWhfJWawnhw54Aku`. The new store was connected to the project; the earlier team-only empty store `store_8JwFWtC25VfyYtEH` was never used by the app. Vercel injected a token for the new store, so the media guard accepts only a fallback token whose store ID matches `MEDIA_BLOB_STORE_ID`. A mismatched token fails closed.

Preview deployment `dpl_Ez3Kf3ySiaCyipgoiwQGzWuqD32F` ran a complete inventory and reported 0 objects, 0 bytes, 0 untracked bytes. Preview deployment `dpl_Gjyc67kRFR3mrsD8XFcCgGBKdwLU` then wrote a tiny private temporary object, read back matching bytes, deleted it, and reconciled a 0-object inventory. Both builds reached READY. `CLICKATICK_RECONCILE_MEDIA_STORE` was reset to false afterward.

The feature-branch Preview has `CREATOR_NEON_CUTOVER_ENABLED=true`, `DEMO_CHECKOUT_ENABLED=true`, `MEDIA_ALL_WRITERS_COORDINATED=true`, `MEDIA_V6_CONNECTED_VERIFIED=true`, and `MEDIA_V6_IMAGE_UPLOAD_ENABLED=true`. Production cutover and media flags remain off. Public Preview `/`, `/discover`, `/creator`, and `/api/v1/events` responded 200; the catalog is empty because no owner has published an event. Preview remains noindexed.

The connected store test proves SDK access and isolated storage operations, not the full browser flow. Still required: authenticated organizer draft, image upload and preview, owner publication, public event read, simulated quote and confirmation, then Production cutover. The signed-in browser session is currently outside the in-app browser; the owner was asked to bring the signed-in Clickatick dashboard forward for that test. Do not claim live publication until those steps pass.
