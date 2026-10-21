# PM handoff 010: A3 direct media upload

Date: 2026-10-21. Source brief `brief/project.json` v104. The prospective `contract/integrated-phase-a3-media-v6.md` adds a direct browser upload and safe temporary-source cleanup to the agreed v4 media contract. Frontend accepted v6 in `frontend/integrated-phase-a3-media-v6-agreement-v1.md` before backend implementation.

Images: at most 100 per brand, 10 MB source and 5 MB normalized output. Videos: at most 10 per brand and 100 MB each, initially MP4 H.264/AAC. Shared free Blob storage must be accounted across all writers before accepting new uploads. The normalized successful photo and successful videos stay until explicit organizer deletion; temporary raw image processing input is removed only after normalized output is verified and ready. Direct upload token size must not exceed the reserved source size. The UI and server gates remain off until connected browser→API→Blob→database verification. Public video playback is a separate gate requiring private byte-range verification.

No external storage, payment, authentication, or deployment action is implied by this agreement.
