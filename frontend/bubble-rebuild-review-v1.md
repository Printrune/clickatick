# Bubble rebuild review corrections v1

Date: 2026-10-18. Brief version 29. Same approved direction and scene-workspace v2 contract.

Moved camera personalization into the bubble header. It is one 44 by 44 pixel icon button, with an accessible name and title. It no longer overlays scene facts or ticket labels. Existing photos open a management dialog without starting the camera. Retake requests the camera explicitly; remove stops media and clears the tab-local portrait. No camera or microphone was used by this specialist.

Added explicit opening and closing transition states. The persistent bubble still follows measured geometry with an interruptible transform. Expanded content remains transparent for the first 280 ms, then fades in over the final 140 ms. The collapsed trigger remains transparent until the last 80 ms of reversal. This prevents stretched text during most of the size change. Content and trigger animations cancel alongside the geometry animation on interruption; keyboard and reduced-motion transitions are immediate. Browser feel and reversal still require PM verification.

The footer wordmark now has an explicit light text color. Mobile titles can occupy two bounded lines rather than always truncating after one. Toolbar controls keep 44 pixel touch areas. The scene specialist owns location truncation and scene-caption spacing.

No new build was started, as instructed. PM should inspect the stable source and include these changes in the integrated build. Changed only Workspace.jsx, CameraPortrait.jsx and bubble.css. No backend, model, publishing or data contract changes.

The expanded shell takes temporary focus during its geometry animation. This keeps Escape and focus containment available before content is revealed. The first input choice receives focus when the animation completes.
