# Front-page setup implementation v1

Brief: brief/project.json v52. Additive draft contract agreed with Backend before coding: contract/front-page-setup-v1.md and refundPolicy addition v2. Designer guidance: design/front-page-setup-v1.md.

## Implemented

- Offline-capable Set up details yourself entry alongside voice/type choices. Existing camera, chat, voice and scene retained.
- Five progressive sections inside the bubble: location, tickets, guest information, referrals, preferences. Mobile scene reduced while forms are active.
- Business address, location photo and precise map pin; same-place checkbox reuses them, separate event values retained on toggling.
- OpenStreetMap tiles load only after explicit load button; normal browser caching/referrer, visible attribution, bounded visible tiles. Click places pin; drag map pans; drag pin and arrow keys adjust. Coordinate inputs and Google/Bing pin links work without map load. First complete pin zooms to street level.
- Device location is an explicit permission action. Photo upload validates supported type/15MB source limit, locally reencodes to JPEG, max1200px, bounded dataURL. Async work retains latest edits and ignores completion after unmount. Venue photos stored only in local draft/download and excluded from AI. Avatar camera behavior unchanged.
- Basic event/title/description/date, format, total quantity and custom categories. Shared/allocated inventory choice explicitly visible, preserving legacy allocated behavior.
- Separate restrictions, editable disclaimer and explicit suggested-text application, reviewed flag, refund policy draft with explicit proposed wording. Optional supportive copy.
- Optional numeric referral percentage and live cent-conserving 10% platform/reward/business split. Post-event payout/cancellation rules shown as draft configuration.
- Mandatory digital-confirmation requirement; selected payment preferences clearly not active. EPay unselectable until identified; cash and cheques excluded.
- Listing preview includes the new settings. Extended setup publication blocked rather than silently dropping fields. Download retains setup/photos. Validated autosave preserves last valid saved draft when temporary values are invalid.

## Evidence

- Source: components/FrontPageSetup.jsx, LocationSetup.jsx, SetupPreview.jsx, Workspace.jsx, ListingPreview.jsx, TicketTypesEditor.jsx, app/setup.css.
- Four direct numeric projection/unprojection assertions passed: Boston (42.355,-71.065), origin, east and west dateline. Found and corrected a 180-degree longitude error before browser verification.
- PM owns full build and browser verification at its recorded preview; no separate preview started by this agent. No paid API calls or deployment.
- Skill evidence hashes: frontend/front-page-setup-skill-evidence-v1.json. Relevant bundled Next client-boundary docs read.

## Limitations

- Address does not geocode automatically; enter coordinates, use device location, or navigate the map. External Google address search helps locate it. Links open the same pin; no external provider write-sync is claimed.
- Real payment collection, buyer email, ticket issuance, referral tracking/payout and extended backend publication remain out of scope.
- Physical device camera, geolocation, microphone and touch-drag verification require actual devices. Browser QA results belong to PM evidence.

## Final source review

- Corrected empty referral preview to a complete sentence; explicit zero remains 0%.
- Traced first-date input through onSchedule to the functional Workspace state update, parseListing, local autosave and scheduleLabel. No source-level loss found; PM is reproducing in browser before changes.
