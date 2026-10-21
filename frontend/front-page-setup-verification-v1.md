# Front-page setup verification v1

Target: clickatick front page, brief v52. Local verification completed. The task-owned preview ran with AI and local publication disabled. Real financial transactions are outside this change.

## Required walkthrough

- Enter setup directly without AI, microphone or camera permission.
- Enter business address, choose an exact map pin, add and remove a venue photo.
- Switch between reused and separate event locations without losing separate details.
- Verify external map links carry the selected coordinates.
- Set capacity, custom concession names/prices and explicit inventory mode.
- Add and edit restrictions and suggested disclaimer; review state resets when text changes.
- Enable referrals, choose a percentage, verify the 10% platform fee and business-funded split.
- Verify payout-after-event and no-cancellation-payout copy.
- Choose desired payment methods; verify no payment or delivery is claimed.
- Verify draft preview, download and reload retain new values. Uploaded photos do not enter chat transport.
- Verify desktop/mobile, keyboard entry, errors, and existing bubble/scene behavior.
- Run meaningful automated validation and build, then Designer review.

## Current evidence

- API/data contract agreed before coding: contract/front-page-setup-v1.md.
- Task-owned preview process: evidence/preview-design-process.json.
- Separate localhost-origin QA draft is used to preserve the existing loopback-origin draft.

## Executed results

- 127 automated tests passed, zero failed. The PostgreSQL verification completed 45 checks; backend activation/origin/session/RPC verification passed. Provider responses were mocked; no paid AI request was made.
- Manual entry worked with AI disabled. Tested separate business/event addresses, reuse toggle, exact coordinates, keyboard pin adjustment, external Google/Bing coordinate links, venue photo upload and removal.
- Map projection roundtrips passed for Boston, origin and dateline coordinates. At mobile width, the restored event pin moved from -71.066 to -71.065828 with ArrowRight. Map tiles and attribution rendered.
- Shared capacity 20, Adults $55 and Under 16 $30 retained in preview. Native keyboard date change appeared in the illustration, preview and exported JSON. Browser automation fill alone did not dispatch the native datetime change; normal keyboard input did.
- Disclaimer suggestions and review were tested. Editing resets organiser review. Refund-policy draft and optional supportive message appeared in preview.
- Referral rate 10% showed $3 platform / $3 referral / $24 business on a $30 ticket. Invalid 99% displayed an error and did not overwrite the last valid saved draft. Empty/zero wording corrected after review.
- Payment preferences stayed explicitly inactive. Digital confirmation and payout-after-event requirements were visible without claiming actual delivery or payouts.
- Downloaded JSON independently inspected: date, capacity, two ticket categories, exact pin, photo data, referral rate, payment preferences and review state all retained. Reload restored the draft and photo.
- Desktop and 390×844 screenshots reviewed by Designer. No design blocker. Horizontal setup-section navigation could have a clearer scroll cue; Continue remains accessible.
- Screenshots at workspace root: clickatick-setup-desktop.jpg, clickatick-setup-mobile.jpg, clickatick-setup-mobile-map.jpg.
- Task-owned preview session stopped after verification. Temporary viewport override reset.

## Limits

- Device-location permission, real camera/microphone and live Claude were not invoked in this walkthrough.
- Maps use selected coordinates and outbound map links. No automatic address geocoding or bidirectional external map edits.
- New setup fields remain browser/download drafts. Hosted publishing, payment processing, ticket issuance, confirmation delivery and referral payouts are not connected by this change.
- Production build and deployment verification recorded separately below when complete.

## Release evidence

- Production build passed locally. Vercel deployment dpl_A7pVcy4vYee59Z5DBqaQ8nMyzJmK reached READY with no alias error. Public alias: https://ticketnest-psi.vercel.app/.
- Public browser verified existing draft restoration, setup navigation, optional referral controls and 10% calculation. No warning/error console entries observed. No existing production draft field was edited.
- Live screenshot: workspace clickatick-front-page-live.jpg.
- Brief v53 records completed implementation; no new owner approval manufactured.
