# PM handoff: integrated ticketing Phase A1

Date: 2026-10-20. Shared brief `brief/project.json` v93.

Backend authored `contract/integrated-phase-a1-v2.md` before implementation. Frontend explicitly agreed in `frontend/integrated-phase-a1-agreement-v1.md`. PM accepts the narrow contract for Clerk-backed identity, Neon-backed brand membership and create/list/switch, and a truthful dashboard setup state. This does not authorize claiming connected accounts, populated events, checkout, or live payments.

Backend owns migration, server adapters, three agreed API routes and focused tests. Frontend owns `/sign-in`, `/dashboard`, `/dashboard/[organizerId]`, brand form/chooser, unavailable states and relevant navigation. The shared API envelope and URLs are frozen for A1. No agent may silently change a shared response or URL; propose a v3 contract and obtain both parties' agreement first.

Approved owner decisions: full Lovable system as destination, preserve conversational `/creator`, public marketplace `/`, Clerk email and Google sign-in, Neon free database, multiple brands and staff, sign-in before publishing, numbered demo seats, no real payment or reservation, Google prototype map. Staff publish rights are pending and outside A1.
