# Story draft contract v1

Agreed before implementation with the Product Manager, using brief version 22 and the owner-approved evolving event scene.

Add canonical `ticketFormat`: `''` means unknown, `digital`, `paper`, or `both`. Missing legacy fields become unknown. Reject other values at the listing boundary. This field describes delivery preference, not admission ticket issuance. HTTP routes remain unchanged. The AI returns the field with the full draft, preserves known details, and asks only missing event or ticket questions. It must not ask appearance, gender, or camera questions.

The preview states the delivery preference. The scene uses phone props for digital, paper props for paper, and both for both. Unknown does not imply a choice. The existing JSON content storage preserves the field without a schema migration. The Product Manager owns the explicit event-ticket editor and scene integration. This backend task owns canonical parsing, Claude schema/prompt, preview delivery text, and focused verification.

No live AI requests, provider activation, account changes, or budget gate changes are authorized by this implementation task.
