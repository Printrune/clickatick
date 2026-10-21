# Rendered scene correction v1

Brief v31. Contract `contract/scene-avatar-v3.md` unchanged. Inspected actual rendered evidence `ticketnest-quick-scene-mobile.jpg` supplied by PM, 2026-10-18.

| Before | After | Why |
| --- | --- | --- |
| Absolute mobile status overlaid the illustrated title banner | Mobile status has its own 18-pixel flow row | Status cannot collide with SVG artwork |
| Idle text repeated general setup messaging | Idle status is visually hidden while its row stays reserved | Reduces noise and prevents artwork shifts when listening starts |
| Answer journal could crowd the small scene with duplicate fact captions | Phones suppress secondary fact captions when the journal exists | Preserves artwork height while retaining capacity and ticket format |

The latest mobile answer note retains its 44-pixel target. Capacity, actual-capacity qualifier and ticket-format caption remain visible. Location and other structured facts still have illustrated props and remain available in ticket review. Journal notes remain bounded and expandable.

Changed only `app/event-scene.css`. No model, interface, backend or dependency changes. PM confirmed scene identity now resets for a new draft and manual edits no longer create duplicate answer revisions.

No build, browser session or paid call was run for this bounded CSS correction. PM should compare the updated mobile screenshot with a real accepted-answer journal, dense facts and active status. Actual physical-device frame rate remains unverified.
