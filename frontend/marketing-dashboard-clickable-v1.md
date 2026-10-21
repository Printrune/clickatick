# Marketing dashboard placement and button behavior v1

Brief: `brief/project.json` v74. Owner requested that event ticket details appear first, with marketing buttons at the bottom. All 34 marketing preview buttons should be clickable and perform no action.

The published demo listing now renders its event details and demo ticket selection before the creator marketing panel. The panel remains visible only to a visitor with that listing's creator credential. Its real Copy link and Promote this event controls remain functional.

The 34 preview buttons are enabled native buttons with `type="button"`. They have no click handlers, navigation targets, network calls, or form submission. Each still reads `Not connected`. The panel explains that pressing them starts no action. Pointer, active, and keyboard focus styling make their clickable state clear.

Files changed: `app/listing/[id]/page.jsx`, `components/MarketingDashboardPreview.jsx`, `app/marketing.css`.

Verification: `node node_modules/next/dist/bin/next build` passed with filesystem escalation. A restricted build first failed because Windows denied a Next.js package junction; the escalated build completed successfully. No live deployment or browser test was performed by this specialist.

Skills read: `.agents/skills/frontend-design/SKILL.md`, `.agents/skills/intentional-ui-design/SKILL.md`, `.agents/skills/emil-design-eng/SKILL.md`, `.agents/skills/workshop-owner-language/SKILL.md`; relevant bundled Next.js page guide. Shared rules, frontend role, root project AGENTS, README, and brief v74 were read.
