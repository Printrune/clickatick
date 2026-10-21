# PM Vercel Git preview verification

Date: 2026-10-21. The owner connected existing Vercel project `ticketnest` to GitHub `Printrune/clickatick`; Vercel's Git context confirmed the link. GitHub repository root is the Next.js app, so Vercel project's Root Directory is unset (repository root). The first branch preview failed because PM temporarily set an incorrect nested workspace path; that setting was corrected before retry. Existing production deployment and domain remained intact.

The branch `feature/integrated-ticketing-foundation` at commit `3c71376` produced READY preview `dpl_DQxUzPKAm2yKXeRVMU1ptGtoH669` at `https://ticketnest-admcog5bg-printrunes-projects.vercel.app/`. Browser inspection showed a 200 marketplace homepage and legacy demo cards because `CREATOR_NEON_CUTOVER_ENABLED` is off. `/dashboard` truthfully displayed “Organizer tools are unavailable. Organizer sign-in is being connected.” The preview is not evidence of a connected Clerk/Neon buyer journey. Production remains on the earlier READY deployment; no new code was promoted.

Vercel project environment metadata currently lists Blob and Anthropic-related names but no Clerk or Neon settings. Those services and migrations must be connected before a creator-to-Neon cutover can be enabled.
