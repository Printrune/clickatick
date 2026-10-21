# Eyebrow label removal v1

Brief: `brief/project.json` v76. The owner requested removal of boxed eyebrow labels across the site, using “Your published event” as the example.

Removed decorative label markup from the published event header, creator promotion panel, guest checkout, demo receipt, creator marketing workspace, dashboard preview, About, Insights, Solutions, and the unavailable page. Removed the matching badge styles.

The Event/Activity label in listing previews still carries useful listing data. It is now plain text, with its pill backgrounds and padding removed across light and dark themes. Checkout and listing demo disclosures remain in body copy. Buttons, controls, ticket details, and dashboard actions remain unchanged.

Verification: searched app/components for remaining `demo-badge`, `dashboard-preview-badge`, and `className="eyebrow"` usage; none remain. `node node_modules/next/dist/bin/next build` passed outside the restricted filesystem. The first sandboxed attempt failed only because Next.js could not create a Windows dependency junction.

Gap: visual browser screenshot and live deployment are for the Product Manager to complete.
