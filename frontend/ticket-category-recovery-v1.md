# Ticket category recovery frontend v1

Brief: `brief/project.json` v59. Contract: `contract/conversation-patches-v3.md`. Date: 2026-10-18.

Read and agreed the contract before the client edit, including additive inventoryMode and provider-only resolveFields. The browser wire shape and state version remain unchanged. Backend owns provider/domain corrections; Frontend does not infer shared inventory from raw words.

## Client change

Extracted the existing setup-to-pending-field mapping into `changedSetupPendingFields` in `lib/chat-client.mjs`. `Workspace.changeSetup` uses that helper. An explicit manual inventory mode change now clears pending inventoryMode, ticketTiers and capacity facts. Price and unrelated schedule facts remain. Existing address, policy and referral clearing behavior is preserved.

The accepted-draft merge already supports shared inventory. A regression verifies a total of ten remains ten after the server returns shared mode. Adult and child category identifiers, prices and quantities remain unchanged. The illustration receives only the accepted draft through the existing accepted-change logic.

## Evidence

`node --test tests/chat-client.test.mjs tests/voice-conversation.test.mjs`: 30 passed, zero failed. The two new client regressions cover manual inventory topic resolution and shared-ten merge preservation. The existing voice lifecycle tests also pass.

No new browser fixture was needed for this small client change. The actual compact-provider route reproduction is Backend's responsibility; a mocked illustration alone would not prove the missing provider capability. PM owns live conversation, browser verification, full build and release.

No paid requests, preview process, deployment or secret access occurred. No issues metadata or client loop counter was added. Decisions needed: none.
