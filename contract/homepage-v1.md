# Marketplace home and creator route contract v1

Date: 2026-10-20. Shared brief v87. Prospective route contract, to be agreed before coding.

Owner decision: the marketplace is `/`; the existing clickatick conversational creator is `/creator`. The entire Lovable ticketing system is the main product. Checkout stays demo-only until verified payments are integrated. Organizer sign-in is approved; provider selection pending.

## Routes and data

- `/creator` renders the existing `Workspace` with its existing connection and session props. Do not alter conversational state, voice behavior, illustration, review, or publication contracts as part of this route move.
- `/` renders a new marketplace landing page. It uses `readDemoCatalog()` to show up to six most recent published demo events, with links to `/listing/[id]` and `/discover`. It prominently links to `/creator` for event creation. If the catalog is empty, explain that there are no demo listings yet; if storage is unavailable, keep the creator path and show a truthful catalog-unavailable message.
- `/discover` remains the full searchable catalog per `contract/api-v3.md`.
- `/start` redirects to `/creator`. Existing inbound `/?start=1` redirects to `/creator` for compatibility. The redirect must not put draft data in a URL or loop.
- Migrate all hard-coded creation entry links, including shared navigation, Discover, published-listing return links and marketing calls to action, to `/creator`. Preserve browser-stored draft restoration and voice entry behavior after the pathname changes.
- Shared navigation points Home to `/`, Discover to `/discover`, and Create tickets to `/creator`. Organizer dashboard navigation waits for auth/provider contract.

## Copy and behavior

Preserve clickatick purple branding, logo, light/dark mode, mobile layout, reduced-motion behavior, and approved value proposition. Do not claim connected payments, issued admission tickets, verified sales, or available payment methods. Catalog cards expose only `api-v3.md` public projection. Public buyers can enter existing demo listing/checkout. No private creator token or buyer data appears on the home page.

## Ownership

Frontend owns page composition, route move, navigation and responsive styling. Backend confirms the public catalog service contract remains sufficient and no private data is added. Both review this contract before code changes. PM records agreement in a versioned handoff.
