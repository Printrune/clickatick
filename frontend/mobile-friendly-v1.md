# Mobile creation refinement v1

Brief: `brief/project.json` v70. Date: 2026-10-18. Read current source, latest brief decisions and the actual relevant Frontend/design guidance already loaded for the approved direction. No redesign or intake restart.

## Changes

Mobile expanded bubbles use an 8-pixel inset and the existing visualViewport height instead of reserving space below the inert page header. This gives chat, setup and review more usable height. Normal illustrated scenes remain visible, with a smaller scene row for manual setup and review. The footer Review action stays in normal layout, outside content scroll regions.

When the existing short-viewport flag is active, the bubble gets compact header/footer spacing. On narrow screens the illustration temporarily takes no height, preserving usable forms and the composer while a keyboard may occupy the screen. On short landscape layouts, a compact illustration remains beside the wider content pane. Voice removes its decorative orb in constrained height and keeps long spoken questions/transcripts in bounded scroll regions. No content or captured words are discarded.

PM's actual844x390 landscape check found the manual form had only43pixels of scrollable height because its introduction and navigation still used desktop spacing. Short-viewport setup now hides that introduction at every width, uses a compact horizontally scrollable44pixel step row, and reduces Back/Continue footer padding while retaining44pixel controls. This frees the manual form independently of portrait media queries. PM rechecks the measured form height before release.

Final populated-draft QA also exposed a problem missed by blank-draft checks: the90pixel mobile manual-setup scene was spending its height on caption/journal text, leaving microscopic artwork and dark text against a Halloween sky. That manual-only thumbnail now hides status, caption, answer journal and tiny illustrated fact cards. Its artwork is centered as a larger clipped panoramic view, retaining the avatar, guests and event setting without unreadable labels. The normal chat/voice illustration and its live answer details remain unchanged. Existing short-viewport form-priority behavior still hides this thumbnail when space is constrained.

Mobile inputs/selects use 16-pixel text, including public demo checkout. Map, setup-step and photo actions have 44-pixel targets. Receipt category names and long listing facts wrap rather than force sideways overflow. Public receipt actions and the header Create tickets link have 44-pixel targets. Existing hero hierarchy, purple artwork, light/dark choice, saved draft, publishing redirect and live service behavior remain.

## Evidence and limits

The installed Next.js SWC compiler parsed Workspace and FrontPageSetup after the footer/focus changes. These CSS/layout refinements do not need new implementation-mirroring unit tests. Designer source review prompted constrained-height/landscape handling and visible focus return from paused voice; both are addressed.

PM owns actual checks at360x740,390x844,390x420 keyboard-height proxy and844x390 landscape, plus dark/light, chat, voice, setup, review and public checkout. Viewport emulation does not prove a physical phone keyboard. No browser success, complete build or release is claimed by this specialist report. No server, deployment or paid call by Frontend.
