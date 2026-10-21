# Marketing workspace review v1

Date: 2026-10-18. Brief baseline: 72. Reviewer role: Product Designer and marketing content review. Source-only review; PM owns browser verification. No application files changed.

## Required fixes

| Before | After | Why |
| --- | --- | --- |
| P2: Video direction buttons overwrite `drafts.video` immediately, including unsaved manual or Claude edits. | Confirm replacement when edits exist, or preserve the existing candidate until the creator accepts the direction. | Selecting an exploratory direction must not silently discard work. History switching already provides the relevant confirmation pattern. |
| P2: Keyboard tab changes set kind but leave `switchVersion` and messages intact. Click changes clear them. | Use one tab-selection handler for pointer and keyboard. Clear pending version replacement on every kind change. | An old-format confirmation can appear in another format with saved history. `chooseVersion` then writes the old draft into the currently selected format. |
| P2: SVG title wrapping uses 25 characters at 66px, independent of glyph width. | Use measured wrapping or a conservative width for wide characters. Test long unbroken and W-heavy titles. | Character counts do not guarantee that rendered text fits the 936px content width. Exact clipping remains a browser measurement task. |

## Browser checks needed before completion

| Before | After | Why |
| --- | --- | --- |
| Tall SVGs grow to hold all restrictions, then fit into `max-height:330px` on mobile and `630px` on desktop. | Verify a 4000-character restriction poster at mobile size. Keep a readable-width preview in a bounded scroll region or provide a clear full-size view if the contained thumbnail becomes unreadable. | Showing an entire tall poster as one small image can make its title and practical facts too small to inspect. This is a source-based risk, not a measured screenshot finding. |
| Copy failure suggests selecting text in a closed details element. | Open the complete caption disclosure when copy fails, or guide the creator to open it. | Recovery should make the selectable approved text immediately available. This is a usability improvement, not a publication blocker. |

## Positive source evidence

`CreatorPromotionPanel` checks the authenticated marketing endpoint before showing creator actions. It offers a public link and one Promote this event action. It does not expose creator keys or assume the public listing ID grants ownership.

The workspace starts with a useful listing-based draft. It names Claude requests separately and states that sending uses the configured API budget. Save and approve are distinct. Copy/download require an approved version that matches the current draft. Edits change that status. Saved versions retain separate approvals and history replacement warns about unsaved edits.

`promotionText` appends the trusted public listing URL and fixed demo notice outside the editable body. The origin is fixed to the known public deployment rather than a preview/local origin. The SVG similarly uses fixed listing facts, demo text and the public link. User-controlled text and alt text are XML escaped. Embedded photos allow only JPEG, PNG or WebP base64 data. SVG source has no scripts, private credential references or remote image requests.

Video/ad content remains text. Two actual direction buttons call different helper arguments. UI states no video file was rendered and nothing is posted automatically. Ad templates label facts, an untested hypothesis and missing data. No source template invents suitability, discounts, scarcity, outcomes or metrics.

Responsive source stacks the preview above controls at 760px. Inputs use 16px text, buttons have 44px minimum height and focus-visible outlines exist. Tabs have selection semantics and Arrow/Home/End handling. Labels bind inputs, disclosures are native and status messages use `role=status`. Both theme palettes are explicit. No new animated UI needs a reduced-motion override. These source properties do not establish full accessibility or physical-device behavior.

## Scope and evidence

Inspected `components/MarketingWorkspace.jsx`, `components/CreatorPromotionPanel.jsx`, `lib/promotion-assets.mjs`, `app/marketing.css`, prior content review and current helper/API contract. Read the actual Designer role and relevant existing design skills and reference guidance. Preserve the approved purple system; no new visual exploration is required.

No browser, actual SVG download, clipboard, provider request, campaign, deploy or physical phone was exercised by this reviewer. PM must verify the rendered main journey and final export. Claims here describe inspected source behavior, not external service success.
