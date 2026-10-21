# Event scene rebuild v1

Frontend specialist, 2026-10-18. Input brief `brief/project.json` version 29. Approved direction and scope follow `design/homepage-rebuild-v1.md` and `design/homepage-visual-audit-v1.md`. `contract/scene-workspace-v2.md` was read and agreed through the PM before edits.

## Delivered files

- `components/EventScene.jsx`: responsive illustration, factual caption, scene changes and activity states.
- `components/ScenePerson.jsx`: original articulated SVG people, held tickets, guide badge and lantern.
- `app/event-scene.css`: scene presentation, local transitions and reduced-motion behavior.
- `lib/scene-model.mjs`: pure accepted-listing-to-illustration model.
- `tests/scene-model.test.mjs`: focused model checks.

No dependencies, external services, listing schema or backend contracts changed. The original licensed raster remains in the project but the illustration no longer downloads or clones it. No browser session, preview server, deployment, camera or microphone was started by this specialist. The PM owns those checks.

## Illustration specification

The host explains an event to a group. Rounded SVG people, shared upper-left lighting, muted violet ground, peach skin and restrained lime ticket highlights form one visual system. Faces, hair silhouettes, coat colors, body widths, head angles, arm poses and heights vary deterministically. The host has greater scale and an articulated explaining hand. Guest eye positions attend toward the host.

The viewBox is 640 by 440. Artwork uses most of its width. Coordinates anchor people at their soles. Fixed crowd slots prevent existing guests from jumping when capacity changes. Their centers are all inside the ground ellipse, verified by test. Larger capacities retain 20 representative figures with the actual capacity and an explicit `20 shown` label.

The phone and paper designs sit in a bent arm, with fingers drawn across the prop edge. The guide badge is at chest height. The lantern handle connects to the host's hand. No open decorative stroke paths retain accidental default fills.

The tour has a marked path and a freestanding abstract route board. It does not invent landmarks or an itinerary. Halloween adds pumpkins and a held lantern. Ghost-story motifs require explicit ghost, haunted or spooky text. Music adds a speaker and notes. Workshops use general materials, with pottery only when explicitly mentioned. Food adds a table and bowl, without an invented outdoor stall. Movement activities add a mat. Outdoor foliage and indoor framing require corresponding accepted words.

Different cues can coexist. Whole-word matching prevents `husband` becoming `band`. Basic local negation suppresses examples such as `No music or pottery`. This is a small deterministic scene vocabulary, not a language model or universal illustration generator.

## Answers and temporary activity

Confirmed time affects lighting. Single-date events use the first accepted date-time; repeating activities use their weekly time. Location, duration, price and ticket types become factual labels. The existing form defaults duration to 60 minutes without a confirmation flag, so that value is omitted unless the text confirms one hour. Other explicitly provided duration values are displayed.

The host breathes very slightly while its soles stay fixed, blinks, attends toward input while listening, changes posture while thinking and gestures while speaking. The state indicator uses the caller's activity value. It never claims an AI request succeeded.

Existing theme groups stay mounted. Cues transition locally through opacity and a six-pixel move. Guests transition at their fixed positions with a short stagger. Accepted factual changes briefly highlight their labels. Listening changes alone do not replay the world. Scene transitions use 250–280 ms and `cubic-bezier(.23,1,.32,1)`. Reduced-motion preferences remove movement and loops while retaining the same final facts.

The optional camera image is a small framed photo beside the neutral illustrated host. It is no longer a crop pasted over the character's face. No physical appearance or gender is inferred.

## Verification

`node --test tests/scene-model.test.mjs` passed all 7 tests after the final implementation pass. Checks cover combined Halloween/tour cues, exactly 20 visible guest models, whole-word and negation behavior, stable crowd identity and geometry, capacity caps, format mixing, explicit settings, individual/weekly time selection, default duration suppression and changed-fact selection.

The initial test caught one rear guest beyond the ellipse. Its location was corrected before the passing run. The mobile screenshot supplied by the PM exposed caption clipping and the photo control overlay. Artwork now flexes within the bounded mobile stage; secondary facts collapse. The PM coordinates the photo control placement in the separately owned workspace stylesheet. Fresh integrated screenshots remain the runtime evidence for the final layout.

Source motion review:

| Before | After | Why |
| --- | --- | --- |
| Whole raster people stamped repeatedly, with independent floating props. | Articulated SVG geometry and attached held props. | People and props share the same pose and lighting. |
| Guests recentered when capacity changed. | Fixed ground slots and local opacity/transform transitions. | Existing people retain spatial identity. |
| No temporary conversation state. | Host listening, thinking and speaking poses driven by activity. | The user can see that input is being handled. |
| Full scene entered again on a theme change. | Persistent cue groups reveal only relevant details. | Unchanged parts remain stable. |
| Mobile artwork height plus captions exceeded its parent stage. | Flexible artwork with compact primary facts. | The composer and scene can share the same viewport. |

Code review permits integrated testing. Actual transition feel, physical-device performance, voice and camera require PM verification. No frame-rate or accessibility-conformance claim is made.

## Skill evidence

Read shared rules, frontend role, project instructions, project marketing context, owner-language skill, bundled Next.js `use client` guidance, selected design handoff and the following actual skills. Their original licenses were preserved.

| Skill file | SHA-256 |
| --- | --- |
| `../skills/illustration-design-grammar/SKILL.md` | `EEEEA0AE257B38BAF6707B4EE29B52CF8A984F6A307BF8F2AAA14F033506C21B` |
| `../skills/frontend-design/SKILL.md` | `D91970639E9F5C37682AC7AB60094D35F1C7C1F38D731BD56396563AEE10C1D3` |
| `../skills/animate/SKILL.md` | `B8EDE161270458E6AE2E45E8A1985373515D4C63DE5568DDB0F9012D7634356C` |
| `../skills/review-animations/SKILL.md` | `6FF590D29E436766135AA3D137BE1FAC2A867165C7257FC315B189361F1873AF` |
| `../skills/intentional-ui-design/SKILL.md` | `B1967540CA5A70D00844A8A70C9F89E1CFE6AE20647FE93D5700C4FC64D81B0C` |
| `../skills/emil-design-eng/SKILL.md` | `FFBE68E6007FB42CB8149F089B400A1CA007D59BA23E8948E2BE4476F3175939` |
| `../skills/yc-interface-craft/SKILL.md` | `8CF5E799A359FAF9C63F466622E55571CD3067C67126879E95775565AAC9944E` |

Also read the motion standards, YC motion/quality and system/surfaces references, and pstack unslop. No new visual exploration was started. No owner decision is required.
