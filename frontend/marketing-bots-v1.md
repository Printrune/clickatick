# Marketing bot roster, v1

Brief: `brief/project.json` v77. This changes only the creator-only marketing preview at the bottom of an event page.

The seven built-in agent types now appear as a bot roster. Each has a distinct colored avatar symbol, a short specialty, and the explicit status `Not connected`. The row has a plus sign to show the future add action. The three custom-agent controls remain under `Bring your own bot`. All ten buttons are still clickable previews without handlers; no bot or service is installed, started, or connected.

The roster uses two columns on wide screens and one on phones. Focus is visible, pointer feedback is local, and reduced-motion users get no translation. The surrounding dashboard remains open and unboxed.

Source: `components/MarketingDashboardPreview.jsx`, `app/marketing.css`.

Verification: `node node_modules/next/dist/bin/next build` passed in the permitted Windows environment. No browser or production deployment was run by this specialist; the Product Manager owns those checks.
