# Event responsive recheck v1

Date: 2026-10-25. Brief: `brief/project.json` v108. Preview under review: `https://clickatick-hfi64pfi0-printrunes-projects.vercel.app/`.

## Recheck status

The new Preview could not be visually rechecked in this specialist session. The in-app browser became unavailable (`browsers: []`), and the shell could not resolve the Preview host while deployment was building. No claim of phone, tablet, desktop or cross-browser success follows from this note.

## Source review of the fixes

- `app/marketplace.css` now gives `.marketplace-event-art` a positioned, fixed 138-pixel flex basis and `overflow:hidden`. Its image is absolutely positioned and fills that frame. This addresses the measured image overrun from audit v1 by construction.
- Event content now has `min-width:0`; title and venue use `overflow-wrap:anywhere`. Venue text may wrap rather than disappearing in a one-line ellipsis.
- `app/theme.css` now places `.nav-actions` into a two-column grid at 480 pixels and below, and permits the create link to wrap. This addresses the previously measured 320-pixel header overflow in source.
- `/discover` uses `app/discover/discover.css`: card art is also a positioned 125-pixel flex frame with an absolutely positioned image. The result grid is one column at 680 pixels and below, two columns through 980 pixels, three above.
- `/events/[id]` uses `app/events/public-event.css`: header and booking columns become one column at 760 pixels and below. A published event is needed for an actual data-filled visual check. The current Preview home previously showed no Clickatick events; no suitable event-detail URL was available in this specialist session.

## Remaining verification

The Product Manager subsequently ran live Chromium DOM measurements on that Preview at 320, 375, 414, 680, 681, 768, 950, 951, 1024 and 1440 pixels. All eight loaded partner cards had zero image/content intersections at every width; document scroll width stayed within the viewport. At 320 pixels, a screenshot showed the four header controls fully visible in two rows, and a scrolled screenshot showed clean card image/content boundaries. `/discover` had no published Clickatick events, but its header and empty state had no horizontal overflow at 320, 375, 414, 680, 768, 1024 and 1440 pixels.

The PM added explicit wrapping to event-detail headings and content after this check. A populated `/events/<id>` page, Safari, Firefox, Android Chrome and iOS Safari remain unverified. Test those before claiming universal browser/device coverage.
