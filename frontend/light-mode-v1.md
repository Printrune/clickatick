# Light mode v1

Brief: `brief/project.json` v66, retained while the later publish-flow steering advances the brief. Date: 2026-10-18.

Added an accessible Light mode switch to the shared header. It uses a native button with switch role and checked state, works with keyboard input, and keeps a 44-pixel target. The compact mobile control retains its accessible name while hiding the visible label. Logo, switch and Create tickets link share one header row. Existing bubble focus/inert behavior is unchanged.

The default remains dark. A static head bootstrap reads only the saved `clickatick-theme` preference and sets the root theme and native color scheme before visible content. The root suppresses the expected hydration attribute warning. Storage access is guarded even when the bootstrap is absent; blocked storage still permits a session-only choice. Other tabs synchronize through storage events. An absent or invalid preference uses dark mode.

`app/theme.css` preserves purple branding without image inversion. Light mode covers the hero, expanded bubble, mode choices, chat, voice status and transcript, manual setup, inputs, map consent and controls, ticket/category review, policies/referrals, errors, and accepted scene captions. Photos, map imagery and avatar artwork keep their original colors. Public demo listings and saved confirmations respect both explicit choices too.

Read the actual Frontend role/shared project instructions, current brief, relevant intentional UI/frontend guidance and existing source. No API, camera, voice, model, storage or publication behavior was changed for this feature.

Evidence: four tests passed in `tests/theme.test.mjs`, including execution of the actual pre-paint bootstrap, blocked storage, invalid preferences, session-only switching and preference removal. Installed Next.js SWC successfully parsed ThemeToggle, Chrome and root layout. These checks do not replace responsive/browser visual review.

PM owns actual desktop/mobile, expanded bubble and public-page verification, full build and deployment. Designer reviewed the source; dark setup subpanels and pale scene-caption findings were corrected before handoff. No server, paid call or deployment by Frontend.
