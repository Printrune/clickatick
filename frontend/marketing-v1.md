# Marketing frontend v1

Brief: brief/project.json v72. Contract: contract/marketing-v1.md, including explicit Claude refinement and storyboard direction addenda. Interfaces agreed before implementation.

## Implemented

- Successful anonymous publishing retains a cryptographic creator capability in its durable publication intent. Exact retries preserve the token and publication ID. Legacy tokenless intents create a new publication ID rather than claiming an existing listing. Existing local event drafts remain intact.
- Public demo listings request authoritative server creator access before showing Copy link and Promote this event. Guests render no creator tools. Private editor access is checked by the protected API; unavailable access shows only a public-listing return link.
- Dedicated /listing/[id]/marketing editor has Social post, Poster, Video script and Ad plan formats. Starters consume the backend event-facts helper. Video introduction and visit directions invoke distinct helper storyboards; no video-rendering claim.
- Original purple SVG poster uses actual supplied event photo, or a text/ticket composition. No generated photograph. Long restrictions wrap and enlarge the source. SVG text is XML escaped; only embedded validated photo formats are used, never remote images. Caption and exports always append the fixed public listing destination and demo disclosure.
- Manual headline/caption/alt/placement edits, immutable saved versions, exact-version approval, prior approved history, approved-only copy/download, and explicit permanent access removal.
- Explicit real Claude refinement calls only on Send refinement. Request IDs persist before POST, retry same content reuses the ID, new attempt is explicit. Failures retain edits and refresh remaining allowance because a claim may already have been consumed. No automatic call on opening or publication; manual editing remains available without AI.
- Canonical public share links use https://ticketnest-psi.vercel.app even when the creator is on a protected deployment URL. No capability appears in URLs or exports.
- Theme-scoped light/dark purple styles, mobile 16px input text and 44px controls, stacked editor, compact visual preview, collapsed caption details, keyboard tab navigation and visible focus.

## Evidence

- node --test tests/publish-intent.test.mjs tests/promotion-assets.test.mjs: 10 passing.
- Installed Next SWC parsed MarketingWorkspace, CreatorPromotionPanel, marketing page, public listing page and Workspace JSX successfully.
- Tests cover token retention/reload, legacy new-publication identity, strict redirect destination, XML escaping, fixed disclosure/link, external-photo rejection and immutable request identity.
- Initial checks exposed a missing SWC loadBindings initialization (corrected check invocation) and long SVG link wrapping (SVG now provides the complete canonical clickable destination). Final focused checks passed.

## Files

components/MarketingWorkspace.jsx; components/CreatorPromotionPanel.jsx; components/Workspace.jsx; app/listing/[id]/marketing/page.jsx; app/listing/[id]/page.jsx; app/marketing.css; lib/publish-intent.mjs; lib/promotion-assets.mjs; tests/publish-intent.test.mjs; tests/promotion-assets.test.mjs.

## Verification still owned by PM

Production build and responsive browser inspection, authoritative guest/creator states, actual immutable save/approval/revoke persistence and any explicitly approved paid refinement. Frontend did not start a server, deploy, call a provider or claim live service success. No external posting, advertising spend or MP4 export is connected.

## Final review fixes

- Storyboard direction changes require confirmation before replacing an unsaved video candidate. All pointer/keyboard tab changes now share one state-reset handler, clearing pending history/direction replacements and the AI badge.
- SVG text wraps using a conservative per-font-size width bound for the936px text area. Wide Latin/CJK strings and long restrictions retain their content and grow vertically. An explicit full-size preview shows the intrinsic1080px-wide poster inside a scroll region, including tall posters; compact mobile previews remain330px maximum.
- Creator panel canonical URL verified through promotionUrl. Text-only formats omit image-description controls.
- Final focused suite:11 passing. New test covers200-character unbroken W/CJK titles and locations plus4000-character restrictions, checks conservative horizontal bounds and vertical canvas containment. Both changed components parsed successfully through installed Next SWC. PM retains actual browser/render verification.
