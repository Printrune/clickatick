# Local account and listing contract v1

Agreed with the Product Manager before implementation, brief/project.json version 13. Owner requests free local operation. Existing listing schema, ticket types and publication validation remain authoritative.

- Local mode requires LOCAL_MODE=true and no VERCEL runtime. Default remains off.
- connections() adds local boolean. Local publishing is available without remote credentials; AI stays disabled in local mode.
- POST /api/auth accepts {local:true}, only from loopback and matching Origin. It creates an explicit local organiser session, not email verification. Response {signedIn:true}; HttpOnly SameSite cookie, eight hour expiry. Only a hash of the random session token is stored.
- DELETE /api/auth removes and revokes the local session.
- POST /api/listings retains {id,draft} and {url}. Local requests require matching Origin, loopback host and verified local session. Existing validation and SQL transaction protect publication.
- Published listings use the existing /listing/:id route. In local mode they are available on this computer only.
- PGlite stores real PostgreSQL data in ignored .local-data. One global initialization promise avoids duplicate engines across route modules. Restart persistence is verified by closing and reopening a temporary disk database.
- No email, payment, admission ticket or hosted service is simulated. No AI requests or paid services are enabled.

File ownership: Backend owns local-store.mjs, services.js, auth/listing handlers and listing read integration. Product Manager owns UI, launcher and brief.
