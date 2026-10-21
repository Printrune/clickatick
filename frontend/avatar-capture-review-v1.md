# Avatar capture review v1

2026-10-18, frontend specialist, brief v31, scene-avatar-v3 contract retained.

PM verified actual browser worker initialization and upstream portrait detection. Review found hair sampling returned skin-like orange because landmark10 lies below the visible hairline on the inspected fixture. I inspected evidence/avatar-reference.jpg. Its visible hair is short and gray/dark. No identity or demographic classification was used.

Changed lib/avatar-features.mjs to search four bands above the forehead at .10, .16, .22 and .28 of face height. Three narrow patches per band provide a local consensus. Skin-similar colors are excluded. Colors matching the adjacent off-head backdrop on both sides are excluded. At least two agreeing patches are required. Ambiguous results use a restrained dark cropped style rather than skin-colored hair. Pixel sampling stays local, bounded and outside the heavy worker inference.

Added three regression cases to tests/avatar.test.mjs: gray hair above a broad forehead, skin-like fallback, and uniform backdrop rejection. Existing fixture now includes an actual head-width hair patch and distinct background. All14 tests passed with node --test tests/avatar.test.mjs. Browser rerun of the actual fixture is delegated to PM and is not yet claimed in this report.

Limits remain: hair sampling is a coarse approximation rather than semantic segmentation. Closely matching background, bald scalp, dyed hair, lighting and occlusions can cause fallback or inaccurate styling. No service/backend interface changes, new assets or model changes.
