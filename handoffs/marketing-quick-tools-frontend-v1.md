# Marketing quick tools frontend, v1

Brief `brief/project.json` v78. Prospective contract: `contract/marketing-quick-tools-v1.md`. Scope: creator-only marketing dashboard at the bottom of a published event and the existing private marketing workspace.

Implemented in `components/MarketingDashboardPreview.jsx`, `components/CreatorPromotionPanel.jsx`, `components/MarketingWorkspace.jsx`, and `app/marketing.css`:

- Facebook, X, LinkedIn, WhatsApp, Telegram, Reddit, and email request a user-controlled share composer. The dashboard never posts. The other 12 channel buttons copy a prepared caption, the canonical public listing link, and the fixed demo notice. A selectable text fallback appears if browser clipboard access fails.
- The media buttons now open the existing social SVG, poster SVG, or video script editor. Their visible labels say what that editor can produce. No new image or rendered video is claimed.
- The seven bot rows open their related editor format and say `No bot connected`. They do not install or run bots. The custom bot area links to the text editor and says service connections remain unavailable.
- A client-side campaign URL builder accepts source and campaign labels, adds `utm_source`, `utm_medium=social`, and `utm_campaign`, and copies the URL. It states that reports are not connected.
- The creator panel reuses its existing authorized marketing GET response to pass listing facts into the dashboard. The workspace reads `?format=social|poster|video|ad-plan` on load. Invalid values retain the social default.

No API route, persistence schema, AI request, social account, posting, or payment flow changed. Existing private creator access and exact-version approval gates remain.

Build: `node node_modules/next/dist/bin/next build` passed in the permitted Windows environment after the final listing-title correction. The Product Manager owns browser verification and deployment. Browser popup behavior and external service composer availability were not verified here.
