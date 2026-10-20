# Build from the owner's shared brief

A business-agnostic Next.js App Router starter. No API keys, AI provider, email, account system, analytics or live webhook. The local example assessment uses fixed rules and sends/saves nothing. Read the owner's files first. Never replace their business with fixture content.

Product Manager asks three initial questions and collects intake and all specialist results in brief/project.json. Research does not repeat intake. Designer + PM choose one useful visitor experience. Frontend + Designer build it; Backend joins only when needed. PM collects decisions and owner feedback. After approval Social Media Manager coordinates Performance Marketer and two creators from this same brief.

Read .agents/product-marketing.md and actual .agents/skills/ files. Preserve attribution/licenses. Source skills do not authorize installing unrelated tools, creating routines or invented urgency/social proof. The owner's request, evidence and project boundaries override those examples.

Adapt copy, offer, buying roles and next action to B2B/B2C/mixed contexts; never assume category alone decides a CTA. Never invent founders, bios, reviews, expertise, outcomes, prices or proof. Ask only missing decisions.

## User language

Read .agents/skills/workshop-owner-language/SKILL.md. Use its ASD-STE100 rules for all owner and visitor text. Keep code and tool details in bot handoffs.

## Product Designer

Load .agents/skills/yc-interface-craft/SKILL.md and its actual reference files as the primary visual-direction workflow. Follow the approved positioning and preserve existing brand equity. For substantial new exploration, show five genuinely different directions using the same real copy and task, recommend one, and wait for the owner’s selection or explicit delegated choice before applying a final system. Small fixes within an approved direction proceed directly. Frontend reads the selected rules and works with Designer throughout implementation. Keep reference research dated; do not imply YC endorsement or copy another company’s identity.

## Build

1. Read/version the intake, approved research/positioning, product requirements and design in brief/project.json.
2. Run npm run configure -- --brief brief/project.json. It validates the contract and generates content/site.json plus .agents/product-marketing.md. Save manual edits before regenerating.
3. Apply actual design/copy skills and customize the source; this visual foundation is not a mandatory brand design.
4. Run npm run check and npm run build. Walk desktop/phone journeys and keyboard/error/success states in a real browser. Show actual evidence.
5. Let the owner review. Deployment and production integrations are separate decisions.

## Content

About: use about-page and copywriting/editing. Verify purpose, origin, people/credentials and offer. Omit unknown claims.

SEO articles: use content-strategy, seo-article, copywriting/editing and SEO audit. Research actual search intent and dated sources, write an original useful answer, then save structured sections to articles in the brief. Keep draft until reviewed. Approved articles need actual author/review date, unique slug/title/description, useful sections and valid source IDs. Structural checks do not replace editorial review.

Programmatic pages: use programmatic-seo, site-architecture, seo-audit and schema. Choose one data-backed page family relevant to this business: use cases, industries, integrations, services or real locations. No keyword-swapped pages, fictional service coverage or mass filler. Each approved solutions row needs distinct uniqueValue, useful sections and sources. Review the first rendered page, intent and internal links before scaling. Rankings are not guaranteed.

Only approved content appears in public routes/listings/sitemaps. Preview is noindex/robots-disallow. Publication requires isDemo:false, publicationApproved:true, a real HTTPS siteUrl and owner review; these flags do not deploy or substitute for actual approval.

## Visitor experience

Replace /start with the approved real journey. Never fake account creation, payment, booking, message delivery or storage. For relevant leads, use the parent kit's disabled webhook-guide.md; keep keys server-side, validate/dedupe and distinguish accepted work from delivery. Optional Gmail needs the connected bot and explicit owner-enabled policy. No real sends from tests. Account products should focus on genuine signup/onboarding.

Keep private briefs, workspace IDs and keys out of reusable exports. No downloaded skill is executed automatically.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Project scope

Use only the project folder and processes created for this task. Record the PID, command and working folder of each preview server you start. Stop only a recorded process that this task started. Never stop processes by port or broad name. If a port is busy, use another free port. Do not change another project. Save each approval in the one shared brief, increase its version, and send the path and version to each specialist. Each specialist must read that version before acting. Do not ask the owner to repeat an approval because a local copy is old.


## Shared design skills

Product Designer and Frontend Engineer use the same actual design skill library, versions and reference files. Both load YC Interface Craft with all seven supplied files; Intentional UI Design; Illustration Design Grammar; Emil design engineering and relevant animation skills; frontend-design; product-marketing; lead-magnets; copywriting; copy-editing; and conversion guidance. Keep the full files available in the shared project. A link or summary is not a loaded skill. Use design-skill-library.json to compare file hashes and preserve licenses. Read the instructions relevant to the current web task; do not load unrelated native-app guidance. Frontend keeps its engineering, SEO, build and test skills as well. It implements the selected type, spacing, color, imagery, interaction and motion rules with the Designer. Do not invent a new direction or repeat exploration after approval. Record the loaded paths, versions and hashes in team evidence and send an acknowledgment to the PM. Review the actual implementation together and fix differences before owner review.
