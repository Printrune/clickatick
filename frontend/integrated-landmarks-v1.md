# Integrated route landmark cleanup v1

Date: 2026-10-21. Role: Frontend Engineer. Shared brief: `brief/project.json` version 107. Approved flow: marketplace `/`, conversation creator `/creator`, organizer dashboard, public event details, and zero-charge demo checkout. Read the current brief, frontend role, shared rules, `AGENTS.md`, Next.js layout documentation, and relevant frontend design and owner-language skills.

`Chrome` in the root layout supplies `<main id="main">` and the Skip to content target for every route. Four integrated route components had another `<main>` inside it: `PublicEventExperience`, `DemoQuoteCheckout`, `PublicDemoReceipt`, and `OwnerPublishedEvent`. Replaced only those inner elements with `<div>` while retaining classes, content, loading/error states, and the root landmark. No API, layout, or visual design contract changed.

Source verification: searching JSX source for `<main` and `</main>` now finds only the single pair in `Chrome.jsx`. `git diff --check` passes. The event-date regression test also passes (1/1). No new build was started because the PM owns the concurrent build. A browser accessibility-tree check of the deployed integrated routes remains necessary after release gates are enabled.
