# Front-page setup contract v1

Brief: brief/project.json v52. Agreement: Backend and Frontend agreed this additive draft schema before implementation on 2026-10-18. PM approved chat route ownership.

## Shape

`draft.setup` contains:
- `business` and `eventLocation`: `{address:'',lat:'',lng:'',photo:null}`. Coordinates are editable decimal strings; photo is null or `{name,mime,dataUrl}`.
- `sameLocation:true` reuses business location without destroying separately entered event details.
- `inventoryMode:'allocated'|'shared'`, defaults allocated for legacy drafts. Shared keeps draft.capacity independent; allocated derives it from category quantities.
- `restrictions:''`, `disclaimer:''`, `disclaimerReviewed:false`, `supportiveMessage:false`.
- `referrals:{enabled:false,percentage:''}`. Percentage is a decimal string of ticket price, from 0 through 90. This technical bound prevents exceeding the business share and does not settle processing costs.
- `paymentPreferences:[]`: card, bank-transfer, digital-wallet, bitcoin, crypto, epay. Preferences describe requested coverage only. EPay provider remains unspecified.

Address max200 characters, coordinates empty or valid numeric latitude/longitude strings, restriction/disclaimer max4000 characters. Photo JPEG/PNG/WebP only, max600000 data URL characters each, name max200. UI reencodes uploads before storing. These are venue photos, never avatar camera snapshots.

## Functions and transport

lib/setup.mjs exports emptySetup, parseSetup, effectiveLocation, toAIListing, mergeAIDraft, mapLinks and referralSplit. effectiveLocation accepts setup. mapLinks accepts location and returns google/bing URLs only when a complete valid coordinate pair exists. referralSplit accepts USD price string and percentage string and returns numeric dollar values for platform, referral and business, before processing fees.

parseListing validates and retains setup. Old drafts receive safe defaults. Local browser storage and JSON download preserve venue photos. Browser calls toAIListing before chat and never sends venue photo data. Server strips photos defensively too. Claude schema permits plain text setup fields but excludes photos, review confirmation and coordinates from model edits. mergeAIDraft retains local photos, coordinates and review status unless disclaimer text changes, then review resets. Existing response without setup preserves previous setup. The reply merge is validated by parseListing.

AI can record explicit address, participation rules, organiser disclaimer, referral preference and requested payment methods. It must not invent legal/medical restrictions, map coordinates, or claim payment, confirmation delivery, publication or payout. Confirmation is a fixed future requirement, not an optional preference or working service.

## Scope and publication

Frontend owns Workspace and components/CSS. Backend owns listing/setup helpers, Claude schema/chat route and corresponding tests. No database, checkout, email or payout implementation. Shared-pool draft publication must remain blocked because existing database contract assumes allocated quantities. Newly configured setup must not be silently published while dropping its fields. Frontend explains download/local draft scope and gates existing publication when setup is configured.
