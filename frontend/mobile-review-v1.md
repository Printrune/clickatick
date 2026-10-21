# Mobile review v1

Brief/project.json v70. Designer review of the bottom Review control, mobile bubble and favicon. Reused the previously read designer role, approved purple direction and actual interface, motion and animation review skills. No source edits, paid requests, preview server or deployment.

## Source findings

The new creation footer is a nonshrinking flex sibling of the active conversation, review or manual setup pane. Each content pane has min-height:0 and can shrink into its available space. Review remains outside the message/setup/review scroll regions. The mobile button fills the footer width and has a 44px minimum height. Footer background, text, focus and button colors inherit the existing dark/light theme rules. Safe-area bottom padding is present.

Manual setup keeps its step count and Back/Continue controls, with a single outer Review action. The final setup step does not add a second Review button. Opening Review stops voice with an explicit pause reason, focuses the review heading and preserves draft state. Escape returns focus to the footer control. No service, publication or payment behavior is introduced.

Two issues were sent to Frontend for correction before runtime signoff:

1. Short keyboard viewports still reserve a scene row, header, composer and the new footer. Around 400px visual height, the message area can collapse and the minimum controls can exceed the remaining pane. Landscape widths above720px bypass the old mobile height rules. Add height-aware compaction that prioritizes working controls and reduces the illustration.
2. Returning from Review focuses the text composer even when voice mode remains paused and the composer is hidden. Focus a visible voice control or footer instead, without automatically restarting the microphone.

The existing visualViewport resize listener updates shell height and removes itself on unmount. It does not account for visualViewport offsetTop, so browser keyboard/panning behavior still needs actual device or browser verification.

Final source revision addresses both reported issues. Mobile expanded bubbles use an 8px inset. Short viewports use a 6px inset, compact header/footer, remove the portrait scene row and hide secondary composer copy. A separate landscape rule keeps usable side-by-side column minimums. Voice mode hides the ornamental orb and bounds question/transcript scrolling while retaining actions. Returning from Review focuses the enabled text composer only when voice is off; paused voice returns focus to the visible footer. The microphone remains paused. These changes resolve the source concerns; actual software-keyboard panning remains a runtime check.

Mobile setup step buttons, map zoom controls, photo actions and camera-status actions now have 44px minimum height, with map zoom controls also 44px wide. Form font size is 16px. Source shows a full-width Review action in both themes, without competing manual-setup Review controls. No remaining source blocker found for this scope.

## Favicon

app/icon.svg is a local square SVG with the approved purple ticket and white cursor, a 64x64 viewBox and no external assets. It matches the selected brand concept. Actual favicon response and legibility in a browser tab remain PM verification.

## Evidence and limits

Independent `node --test tests/voice-conversation.test.mjs tests/theme.test.mjs` passed 26 tests. These check voice pause/resume lifecycle and theme helpers, not layout or focus placement. PM owns browser evidence at 360x740 and 390x844, plus a keyboard-height viewport and landscape. Verify no horizontal overflow, visible persistent Review, usable setup scrolling, voice return focus, light/dark contrast and favicon retrieval. No rendered mobile screenshot or measured geometry is claimed by this source review.
