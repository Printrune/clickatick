# Bottom review control v1

Brief: `brief/project.json` v69, retained in v70 mobile follow-up. Date: 2026-10-18.

Moved the primary Review tickets action from the bubble header to one persistent footer inside the creation pane. It appears in chat, voice, manual setup and review. The footer is a normal non-shrinking flex child outside those scroll regions, so it does not overlay the composer, form or publishing panel. Header setup, camera and close actions remain.

The same control toggles Review tickets and Conversation. It retains busy guards, voice pause on review, the review-button focus ref, expanded/controls semantics and Escape focus behavior. Returning from review focuses the text composer only when visible/enabled; paused voice returns focus to the footer without reopening the microphone.

PM browser QA also exposed an existing setup caller issue: opening manual setup paused the voice controller even when voice had never started. `openSetup` now pauses only when voice mode is not off. A manual-only Setup→Review→Conversation journey therefore returns to typing, while an actual voice session remains paused for explicit resume. The controller API is unchanged.

Manual setup retains Back and Continue navigation, but its final duplicate Review draft action is removed. The one outer footer control handles review from every setup step. The edit-form Review listing submit still returns from editing to preview.

Updated flex sizing keeps the active content pane scrollable above the footer. Mobile uses a full-width 44-pixel review target, safe-area bottom padding and existing theme variables. Both changed JSX files parsed through the installed Next.js SWC compiler. No markup-mirroring tests were added.

PM owns actual desktop/mobile/short-height browser verification, build and release. No API/data contract change, server, deployment or paid call. Favicon is PM-owned and was not changed by Frontend.
