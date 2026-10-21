# Light mode review v1

Reviewed brief/project.json v66, then v67 with the same approved theme scope. Designer role review of the existing approved purple bubble direction. No new visual exploration, source edits, server, deployment or paid calls.

## Evidence

Read ThemeToggle, theme helpers, layout bootstrap, Chrome header, theme.css and the underlying bubble/setup/public styles. Read the actual designer role and relevant interface-craft, intentional UI, frontend design, illustration, motion and animation review skills. The existing direction is preserved.

Independent `node --test tests/theme.test.mjs` passed 4 tests. These execute the actual bootstrap and helpers for saved choice, blocked/invalid storage, current-document switching despite write failure and cross-tab preference normalization.

The bootstrap sets the HTML theme and native color scheme in the head. Client render starts with the same switch state as server render, then synchronizes in an effect. Storage access is guarded, including the localStorage getter. Images, venue photographs, map tiles and scene SVGs are not inverted. The switch has an accessible name, switch state, 44px minimum height, visible focus and reduced-motion support.

Source color calculations give primary text 14.76:1 on the light canvas, muted text 6.94:1 on white and 5.64:1 on soft panels, white action text 7.13:1, and focus purple 6.67:1 on the canvas. These are calculations for specified solid colors, not a claim that every rendered pixel or state passes an accessibility audit.

## Findings and revisions

Frontend fixed the unguarded storage getter, pale scene labels on the light surround, and dark setup disclaimer/referral/confirmation panels whose text had become dark. Footer/help text, read-only fields, placeholders and pin tags now have explicit light rules.

Remaining finding sent to Frontend: text field borders #bea1d2 have only 2.28:1 against white and 2.08:1 against the inset canvas. Public checkout uses the still lighter divider token. Near-white fills also do not identify controls strongly. Use a separate stronger control boundary, leaving decorative separators soft. Manual setup inputs should have an explicit light selector that outranks their original not-checkbox/not-file rules, rather than depend on stylesheet chunk order.

Final source revision resolves this finding. Composer, general fields, explicit higher-specificity manual fields and public checkout now use #9770ad. Calculated border contrast is 4.01:1 against white, 3.67:1 against the inset canvas and 3.25:1 against the read-only fill. Native light color scheme and read-only colors remain explicit. No remaining source blocker found. Re-ran the four theme tests together with five publication-intent tests, all 9 passed.

## Runtime evidence still needed

PM owns screenshots and browser verification. Source sizing suggests the compact header fits 390px, but this reviewer has not measured rendered widths. Check the header at 390px, manual setup computed field colors, voice and review screens, public checkout and receipt, keyboard focus, reload without a visible theme flash, and console hydration warnings. No service behavior was changed by the reviewed theme modules. Brief67 publishing changes are reviewed separately.
