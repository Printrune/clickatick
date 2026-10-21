# Frontend agreement: A3 media v6

Date: 2026-10-21. Reviewed against `brief/project.json` v104, `contract/integrated-phase-a3-media-v6.md`, and `frontend/integrated-phase-a3-media-v5-review-v1.md`.

**Agreed.** V6 resolves the v5 retention objection. It keeps the verified normalized image until explicit organizer deletion and treats the raw server upload as temporary. It commits a usable ready image before source cleanup, charges both physical objects until cleanup is confirmed, retains the original device file, and makes failed cleanup recoverable without deleting or downgrading the normalized image. The `sourceCleanupPending`, `sourceStoredBytes` and `storageBytes` fields give Frontend truthful private status without exposing source paths.

There is no remaining frontend interface blocker. The old multipart image path must stay disabled until the direct upload, normalization, accounting and connected checks pass. Agreement is not evidence that those services work yet.
