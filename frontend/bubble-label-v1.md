# Alternating bubble label v1

Brief: brief/project.json v55. Owner requested automatic alternation between singular “Create my ticket” and “Create my event”.

## Changed

- Workspace trigger displays both approved labels in one grid cell and crossfades them on an eight-second cycle.
- Shared grid sizing reserves the longer label width, preventing label changes from moving the button contents.
- Opacity-only crossfades last approximately 480ms, separated by several seconds of stable text. Hover or keyboard focus pauses the animation.
- Reduced motion shows a static “Create my ticket”.
- Animated text is hidden from accessibility APIs; the button has a stable “Create my ticket or event” name. Saved drafts add “Continue saved draft” to the accessible name.
- Opening behavior, saved draft restoration, camera request and all setup controls unchanged.

## Evidence

Read brief55 and relevant actual animation-performance and YC motion/craft guidance, with Frontend role and Next client-boundary docs already loaded. Source changes limited to Workspace.jsx label markup and scoped bubble.css rules. No JavaScript timer, new dependency, API, deployment or preview process. PM owns browser verification and production build.
