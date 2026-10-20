# Claude activation diagnostics v2

Brief version 25. Provider output format remains unchanged. Diagnostics add fixed classes for OAuth credential rejection, account verification/disablement, region restrictions, model retirement, token limit, conversation message format, and workspace/organization spending caps. Generic failures reveal only a bounded fixed vocabulary of parameter and account markers. No provider excerpt is returned or logged.

Verification: 36 mocked adapter tests passed, including non-disclosure and single-request checks. No live request or secret access by specialist.

Workspace sends a restored initial assistant greeting because its removal uses object identity. This is a real restoration detail, but no provider error proves that it caused the observed failure. Messages API documents alternating roles, combines adjacent same-role turns, and treats final assistant messages as prefill. Current send ends with user role, so it does not prefill. API reference: https://platform.claude.com/docs/en/api/messages/create . Do not change message history speculatively.

PM may redeploy diagnostics. If the fixed marker is still insufficient, a dedicated safe diagnostic retrieval would be needed; runtime log connector remains inaccessible per PM evidence.
