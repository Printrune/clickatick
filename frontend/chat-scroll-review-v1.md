# Conversation scroll anchoring review v1

Date: 2026-10-18. Brief version 29. Scope: Workspace.jsx only. Existing scene and backend contracts retained.

PM reproduced the regression in a live connected conversation. The newest reply was visible at 546 pixels, but resizing to desktop and then to 390 pixels returned the log to its first message.

The old effect only adjusted scrolling when messages or workspace state changed. Viewport reflow changed both the log height and wrapped message height without triggering that effect.

Replaced that effect with a ResizeObserver watching the scroll viewport and an inner message-content wrapper. A stored follow-latest flag begins enabled for restored conversations. When enabled, a resize, message addition, busy-state change or text reflow anchors the log to its current bottom. Explicit user scrolling away from the bottom disables following. A reader reviewing older replies retains their scroll offset through reflow; it is clamped only if the new content is shorter. Returning to the bottom re-enables following. Sending a new answer and resetting a draft explicitly re-enable following.

Scroll events caused by geometry changes cannot overwrite the stored reading intent before the observer runs. Programmatic alignment records its resulting scroll offset before its scroll event is delivered. Hidden/review layouts with zero height are ignored. Reopening review restores the saved scroll intent.

No production build, deployment, browser operation or AI call was made by this specialist. PM should retest the already saved conversation at 546, 1440 and 390 pixels, then scroll upward manually and resize again. Also verify a reload starts at the newest reply and returning from review preserves the chosen reading position.
