# TicketNest frontend verification v1

Date: 2026-10-17. Input brief: version 9. Main session acting as Frontend Engineer and Product Manager.

## Changes from specialist review

Preserved the approved Clear workspace direction. Replaced idiomatic headings with direct listing copy. Increased supporting text to 13px and controls to 14px with 44px minimum height. Disabled conversation, microphone, and spoken-reply controls while the live agent is unavailable. Hid disconnected prompt suggestions. Made draft download the available primary action when publishing is disabled.

The detail counter now describes started groups rather than publication readiness. Mobile retains fee information and includes a direct listing-preview link. Corrected the Phoenix browser-test draft to America/Phoenix. No user event was invented or published; this is local test data.

## Reproducible checks

- `node --test tests/*.test.mjs`: 19 passed.
- `node scripts/configure.mjs --check`: passed.
- `node backend/verify-v2.mjs`: passed with every external request intercepted. Added internal listener versus Host origin regression cases.
- `node scripts/check-offline-preview.mjs`: actual local server passed homepage, three disconnected-service responses, and three cross-origin rejections. Network sandbox blocked the first attempt. Approved execution outside that restriction passed.
- `node node_modules/next/dist/bin/next build`: production build passed after the final source change. The sandboxed attempt failed on filesystem canonicalization; approved execution outside that restriction compiled successfully.

The live HTTP check first exposed a same-origin mismatch caused by the server listener hostname. Fixed it using the actual destination Host and protocol. The corrected live check passed.

## Browser evidence

The PM operated the real local browser. Entered activity details, selected a weekly schedule, entered date range and time, selected Saturday, reviewed the listing, and reloaded. Draft values persisted. The initial unconfigured login dialog correctly disclosed unavailable services. In the revised build, unavailable publication controls are disabled and draft download is primary.

Desktop screenshot: `C:/Users/dev/Documents/ChatGPT/Ticketing/ticketnest-desktop-v2.png`.
Mobile screenshot: `C:/Users/dev/Documents/ChatGPT/Ticketing/ticketnest-mobile-v2.png`.

Requested viewport: 390 by 844. Observed document client width: 375. Document scroll width: 375. No horizontal overflow observed. Restored the default viewport afterward. These are browser viewport checks, not physical-device tests.

## Limits

No live model call, microphone recording, email delivery, SQL execution, real login, account creation, or public publication was tested. No external service is activated. Budget reservations do not prove actual provider spending until model rates are verified. Per-visitor abuse controls remain required before public activation. The site remains an unindexed local preview and is awaiting owner review.
