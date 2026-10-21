# Marketing workspace review v2

Date: 2026-10-18. Brief baseline: 72. Follow-up to `frontend/marketing-review-v1.md`. Independent source review only. PM handles final live/browser verification. No application source changed by this review.

## Prior findings

| Before | After | Result |
| --- | --- | --- |
| Selecting a video direction overwrote unsaved edits immediately. | Dirty drafts now show Replace with this direction and Keep editing. Only confirmed replacement calls `applyDirection`. | Closed in source. |
| Keyboard format changes retained an old-format pending history confirmation. | Pointer and keyboard controls both call `changeKind`. It clears pending version/direction state, messages and the full-size preview. | Closed in source. |
| SVG wrapping allowed 25 wide headline characters at 66px regardless of available space. | Wrapping now applies a conservative 936px text-width estimate based on font size before splitting words and long tokens. | Closed in source. Actual rendered glyph bounds remain part of PM's export/browser check. |
| Tall posters became small when fitted inside the preview height. | A labelled full-size control opens a bounded scrollable 1080px preview. Its image has no maximum height. The close control remains within that region. | Readability access added. PM should verify its mobile and keyboard behavior. |

The public-listing copy panel uses `promotionUrl`, which returns the known public production origin. Copying on a local or preview deployment therefore retains the intended public destination. Caption and SVG exports still append their fixed demo notice and trusted public link. SVG text escaping and safe embedded raster restrictions remain intact.

The image description editor is now limited to visual formats. Video and ad-plan outputs remain text drafts. Exact saved-version approval still gates copy and download. No automatic social publishing or video rendering claim was introduced.

## Remaining limits

The optional clipboard-failure improvement from v1 remains unchanged. The caption is available in a native disclosure, but the failure does not open it automatically. This does not block completion.

PM reports 254 full tests, 11 focused tests and the final production build passing. This reviewer inspected the final source changes, rather than rerunning those checks. Final production deployment and the rendered phone/export flow are not verified by this source review.

No unresolved source blocker remains from the three required v1 findings. Preserve the explicit distinction between source review, tests and final live verification in the completion report.
