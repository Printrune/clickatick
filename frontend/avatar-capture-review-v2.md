# Avatar capture review v2

2026-10-18, frontend specialist, brief v31, contract unchanged.

PM browser rerun after reviewv1 returned hairColor #675e61, correcting the skin-like orange hair. It also exposed a second problem: a single lower-face side sample classified the short-haired fixture as long-haired, apparently sampling clothing or backdrop.

Changed lib/avatar-features.mjs so long hair requires matching patches at all four vertical offsets .15, .35, .55 and .72 of face height on both sides. Each patch must match sampled hair within38 RGB distance and differ from sampled skin by more than38. A lone jaw or clothing patch cannot trigger long hair. Ambiguous results stay short, or cropped when hair sampling itself is uncertain.

Added shirt-only lower-face regression and a positive continuous side-band long-hair test. All16 avatar tests passed. PM owns the final actual fixture rerun and integrated browser/build verification. No identity or sensitive-attribute inference, model, dependency, asset, controller or server changes.
