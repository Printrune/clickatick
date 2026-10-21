# Frontend review of integrated Phase A2 v1

20 October 2026. Reviewed `brief/project.json` v93, the frontend role and shared rules, the prospective `contract/integrated-phase-a2-v1.md`, and the current `Workspace`, listing, and setup parsers. Relevant UI, TypeScript, and auth skill guidance was read in the preceding frontend review/implementation round.

## Verdict

Agree with the private draft snapshot, brand-scoped APIs, same editor for manual and imported drafts, server-owned IDs, optimistic versioning, and keeping publication outside A2. **Amend before implementation** on the import and map/media paths below. These are interface details that both Frontend and Backend would otherwise have to guess.

## Required contract amendments

1. **Define exact schedule DTO and legacy mapping.** The legacy `schedule.dates` contains local `YYYY-MM-DDTHH:mm` strings. The new example shows `dates:[]` but does not say whether entries are strings or objects, and `localTime` is singular. Specify `dates` as an array of local datetime strings, or define a dated occurrence object. Preserve the local wall time and IANA timezone without UTC conversion. For weekly schedules map `start`/`until`/`time` to `startDate`/`endDate`/`localTime`. Empty date rows are filtered by `parseSchedule` and should not become failures.

2. **Resolve legacy `location` and price/capacity conflicts.** `parseListing` can contain a standalone `location` when `setup.business.address` is empty. Import must map that address to `businessLocation.address`, or explicitly return `UNMAPPED_FIELD` while retaining the browser draft. If `setup.sameLocation=false`, preserve the business address separately and map the event address; do not substitute the effective event address for business address. With tier allocations, `parseListing` derives `capacity` from tier quantities in allocated mode; with shared mode it keeps an independent shared capacity. State the authoritative field for each mode and how blank price/quantity becomes null. The generated General admission tier must not be claimed complete when price or capacity is blank.

3. **Define image import recovery precisely.** Current location photos are inline `setup.business.photo` and `setup.eventLocation.photo`; the scene cover is `coverImage`. The proposed import silently makes their asset IDs null, then says A2 never silently discards a field. Return warnings for each present inline image, retain the full original device draft until the organizer explicitly confirms import, and offer upload from those local images without requiring the organizer to find them again. State whether import is considered successful but incomplete when media is pending, and whether a successful upload can be attached later by PATCH without reimport. Do not clear local storage after a server 201; only an explicit organizer action should remove it. A user with multiple brands must choose the destination brand before upload/import.

4. **Specify the pin selection UX and coordinates contract.** External map links opened from already stored coordinates do not let the organizer place or adjust an exact pin. A2 needs a map picker or an honest interim coordinate entry with a live map preview and draggable pin before claiming the pin requirement is implemented. Define where the picker gets tiles/geocoding, what happens when unavailable, and whether address changes clear the existing coordinates. The current `mergeAIDraft` clears pins on changed addresses, which is a safe default; manual edits need the same rule. A plain Google/Bing link alone is insufficient for this approved owner requirement.

5. **Fix route and post-sign-in import handoff.** Name the frontend routes (suggest `/dashboard/{organizerId}/events/new` and `/dashboard/{organizerId}/events/{eventId}`) and the creator-to-dashboard action. After sign-in, zero brands requires brand creation, many brands require choosing one, then import should be initiated from the unchanged local draft. The current `/creator` button still publishes a public Blob demo; A2 must label “Save to brand draft” separately and not imply that this is the new signed-in publish flow. Define safe return behavior if authentication or brand choice is canceled.

6. **Set finite media and body rules now.** The contract says body and seat bounds are “proposed,” but Frontend must validate before sending. Fix the JSON limit and seat count in the agreed contract. For upload, specify dimension/pixel limits, whether client-side conversion of data URLs is accepted as multipart binary, and whether the 2 MiB limit applies before or after server re-encoding. `previewUrl` should be a same-origin authenticated route, with a stable ID for rendering in the editor. State the abandoned-asset retention rule before enabling unrestricted photo upload.

## Non-blocking observations

- Keep `inventory.dateScope = null` visible as a required organizer choice before eventual publish. Never derive it from one or multiple dates. Keep `tierScope` independent.
- The old `ticketFormat` allows blank, while the new example defaults digital. Preserve blank as an incomplete draft or return a warning; a silent digital choice changes organizer intent.
- The old referral percentage supports two decimal places and 0–90%; converting to integer basis points is exact. Distinguish blank null from 0%, and do not activate payments or rewards.
- `businessLocation.name` is new. Its empty default is fine for imported drafts; no fabricated name.
- A2 should show a genuine draft list/empty/error state, never claim a published event or sales count. Keep A1 unconfigured Clerk/Neon states honest.
- The private media design is directionally sound. Cross-brand asset checks, no Blob path exposure, and signed-in image responses are necessary.

## First implementable frontend slice after amendment

Build the brand dashboard draft list, empty state, route skeleton and manual canonical draft creation using the agreed envelope. Keep import and media controls disabled until the exact mapper, route handoff and pin/media behavior above are contracted. Then add the shared editor and import with conflict/retry handling. No public marketplace, Blob demo checkout or creator conversation regression is acceptable.

## Owner decisions for PM, one at a time

The owner still needs to choose editor rights and media retention, as the contract records. The map provider/picker behavior also needs PM confirmation if a provider-dependent solution is proposed. This review does not ask the owner directly.
