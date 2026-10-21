# PM handoff: private media Phase A3

Date: 2026-10-21. Shared brief `brief/project.json` v97.

Backend wrote `contract/integrated-phase-a3-media-v2.md` before implementation; Frontend explicitly agreed in `frontend/integrated-phase-a3-media-agreement-v1.md`. PM accepts the protocol for private brand-owned photo upload, preview/list, attachment references and explicit deletion. Owner decided successful uploads remain until explicitly deleted; an in-use photo must be detached before deletion. Failed partial writes may be reconciled without discarding a successful asset. Existing device images remain available during import.

Backend owns Blob/Neon adapters, quota enforcement, media routes, and tests. Frontend owns photo controls, pending/retry/error states and draft attachments. The proposed limits of 100 assets, 100 MiB, 10 uploads per hour and two pending uploads per brand are **not yet approved by the owner**. Code may be prepared against these bounds, but active upload/delete must stay gated until the limit decision is recorded and verified. No claimed live storage success without credentials and end-to-end verification.
