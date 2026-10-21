# PM agreement handoff 001

Date: 2026-10-20. Brief v84. API contract: `contract/api-v3.md`.

Frontend and Backend both explicitly agreed to the amended public catalog contract before application coding. Their review evidence is `../../../../integration/contract/api-v3-frontend-final-v1.md` and `../../../../integration/contract/api-v3-backend-final-v1.md`.

Owner-approved direction: integrate the full original ticketing system as the main product; retain conversational ticket creation; demo checkout for now; organizer sign-in for management. Homepage placement is pending and does not gate a standalone `/discover` route.

Backend owns `readDemoCatalog()` and meaningful tests. Frontend owns `/discover` with case-insensitive search and event/activity filter. Keep the existing creator and published listing routes functioning. Do not imply payment, inventory reservation, admission, or sign-in has been connected by this slice. The raw Supabase checkout and data are not imported.
