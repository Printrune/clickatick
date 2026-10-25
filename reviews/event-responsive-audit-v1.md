# Event responsive audit v1

Date: 2026-10-25. Brief: `brief/project.json` v108. Scope: consumer home and Ticketmaster event cards in the Preview deployment `clickatick-gth9g1jvr-printrunes-projects.vercel.app`. This is an audit, not implementation.

## Evidence

- Browser: Clickatick in-app browser (Chromium). Viewport widths: 320, 375, 414, 768, 1024 and 1440 pixels, each at 900 pixels high. Inspected live images and measured DOM rectangles.
- Source: `components/PartnerEvents.jsx`, `components/CutoverCatalog.jsx`, `app/marketplace.css`.
- Firefox, Safari, Android Chrome and iOS Safari were not available in this audit. Their behavior remains unverified.

## Findings

1. **P1 — Event images overlap text at every measured width.** `.marketplace-event-art` has a fixed 138-pixel height, while its image gets a larger intrinsic layout height. At 768 pixels, images measured 183 pixels high, extending 45 pixels into `.marketplace-event-content`. At 1440 pixels, images measured 217 pixels high, extending 79 pixels into content. The live tablet view visibly places the Ticketmaster label and, for some events, title and venue over the image. Fix by making the art element a positioned, clipped, non-shrinking frame and absolutely filling it with the image. Verify the image bottom never exceeds the content top.
2. **P1 — Header causes horizontal scrolling on a 320-pixel phone.** At a 320-pixel viewport, document scroll width is 367 pixels. `.nav-actions` and `.nav-create-link` extend to x=367. The live phone view shows the last navigation label cut off. Collapse or wrap the header actions at the narrow breakpoint. Keep the primary actions reachable without sideways scrolling. Verify `document.documentElement.scrollWidth <= innerWidth` at 320 pixels.
3. **P2 — Venue text is cut to one line without a way to read it in the card.** `.marketplace-event-content>span` uses `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`. Long venues such as “V Theater at Planet Hollywood Inside the Miracle Mile Mall” are visibly truncated. Permit two lines or provide an accessible full venue label; do not let date and title collide. This affects both partner and Clickatick home cards.
4. **P2 — Event card images have mixed composition and focal points.** The fixed 138-pixel frame with `object-fit:cover` crops portraits and posters heavily. Once the overlap is fixed, inspect representative portrait, wide and poster artwork at mobile and desktop sizes. A modest aspect-ratio frame and sensible fallback would improve consistency. This is a visual quality issue, not evidence of missing data.
5. **P2 — Cross-browser claim cannot yet be made.** The audit exercised only Chromium. Safari and Firefox need a real device or browser run, especially for grid image sizing, font wrapping and 200% zoom. Automated DOM checks should include the 320-pixel minimum and the 680/950-pixel breakpoint edges.

## Current behavior that held up

- Event cards switch from one column on phones to two on tablets and three on desktop.
- Long event titles wrap in card content (`overflow-wrap:anywhere`) and did not produce a horizontal scrollbar themselves.
- The 375-, 414-, 768-, 1024- and 1440-pixel viewports did not show horizontal document overflow. At 375 pixels, `scrollWidth` was 376 pixels, likely rounding; verify after the header fix.

## Suggested acceptance checks

- At 320, 375, 414, 680, 681, 768, 950, 951, 1024 and 1440 pixels: no horizontal document overflow, no card image intersects title/location/date/actions, and every header action remains operable.
- Repeat on live provider data with short, long and punctuation-heavy event titles, plus wide and portrait images.
- Confirm keyboard focus and reduced-motion states. Run Safari and Firefox before claiming all-browser support.
