# A3 v6 integration review: unknown store size

Date: 2026-10-21. **Retrospective implementation review**, not a prospective contract agreement.

Backend currently returns `UsageSummary.observedStoredBytes:null` until a trustworthy complete-store scan. This differs from the earlier numeric-only DTO but prevents an unknown total from appearing as zero. Frontend accepts this safer projection. The brand media UI already treats a null byte value as “Unknown,” displays an explicit unknown-storage notice, and disables upload through server `MediaCapabilities`. It does not calculate shared remaining bytes from the observed total.

No frontend correction is required for this deviation. The contract should record the nullable field for future consumers, and connected verification must confirm a complete scan before upload controls can be enabled.
