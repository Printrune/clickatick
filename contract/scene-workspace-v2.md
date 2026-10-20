# Scene and workspace interface v2

Brief version29. Approved before this rebuild, 2026-10-18. Scope is frontend only; existing chat/listing/server contracts remain unchanged.

EventScene default export accepts draft (existing canonical listing), portrait (optional local data URL), compact (boolean, initial host treatment), activity ('idle'|'listening'|'thinking'|'speaking'), and revision (nonnegative number incremented on accepted draft updates). All additions optional with safe defaults. Export sceneTheme(draft) if existing callers/tests require it.

Scene reads only confirmed draft for event facts. Activity can animate the host before answers arrive, but must not invent event facts. Scene handles its own SVG artwork, responsive scaling, changed-detail animation, caption/fact overlays, reduced motion, crowd caps and ticket props. Internal pure model may live in lib/scene-model.mjs. No API schema additions or external image-generation requests in the product.

Workspace owns one persistent bubble shell, phase transitions, voice/text input, chat, editing/review drawer, saved-draft controls and activity/revision state. Scene and current conversation remain together. Desktop side-by-side inside bubble; mobile uses a compact pinned scene above conversation with bounded internal scrolling, readable controls and accessible editor disclosure. Same bubble surface must transform from trigger geometry to expanded geometry and reverse with reduced-motion fallback.

Scene implementer exclusively owns components/EventScene.jsx, app/event-scene.css, optional new components/ScenePerson.jsx, lib/scene-model.mjs and focused scene tests. Workspace implementer exclusively owns components/Workspace.jsx, IdeaEntry.jsx, CameraPortrait.jsx, ListingPreview.jsx, app/bubble.css and any new UI-only components. Do not edit global CSS/shared listing/backend data modules without PM agreement. Existing raster may remain unused as licensed historical asset; avoid new external dependencies.

Designer owns design/homepage-rebuild-v1.md and review artifacts. PM owns integration, browser verification, deployment and brief. All changes follow existing approved dark violet/lime dimensional direction, without restarting visual exploration.
