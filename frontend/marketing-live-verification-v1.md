# Listing marketing live verification v1

Date: 2026-10-18. Brief v72 implementation, with additional dashboard preview requested in v73.

Production release dpl_4fV6VUERMQKWVgwWsxN9576H5GYQ was READY on ticketnest-psi.vercel.app. Eight manifest chunks, 87 source files. Final build passed. The full suite passed 254 tests with filesystem access required by disk-backed PostgreSQL. Restricted runs aborted two disk tests; those passed outside the restricted filesystem, and the complete suite then passed. The final focused intent/export check passed 11 tests after reviewed UI fixes.

## Real service checks

`scripts/verify-live-marketing-v1.mjs --confirm-public-demo --confirm-one-ai-request` passed all checks. Evidence: `evidence/live-marketing-v1.json`. One explicitly authorized fictional-marketing Claude refinement succeeded. Its identical retry returned the cached result. The script verified protected creator cookies, guest/wrong-secret denial, saved versions and retry, conflict rejection, exact-version approval, new-edit review state, refresh persistence, origin protection and durable revocation. Public listing remained readable after revocation. No ad, social post, payment or rendered video occurred.

## Actual browser journey

The protected deployment share-link tool returned 403. No deployment protection was changed. To preserve the user's existing primary-origin draft, a task-owned loopback proxy served the already public production build from a fresh local origin. The proxy only forwarded creator cookies it had itself issued during this test and removed Secure solely from these loopback test-cookie responses. Production cookies remain Secure. No unrelated browser cookies or external service credentials were forwarded. Source: `scripts/preview-live-proxy.mjs`; process record: `evidence/preview-live-proxy-process.json`.

Created fictional demo event 56483015-b3a9-419a-9441-22fb4611a692 through the actual setup and publish UI. No reset or replacement of the user's draft. Publishing redirected to the persisted event page, where server-authorized creator tools appeared. Public copy-link field used the canonical public destination. Opening Promote loaded listing-based content without another questionnaire. Saved and approved one version. Editing disabled approved-copy/download controls. Reload restored the original approved version and content.

Downloaded the real approved SVG to Downloads/clickatick-social.svg and checked its visible text, fixed demo disclosure, public href, timezone and absence of scripts or creator credentials. Copied verified source to `evidence/marketing-approved-poster-v1.svg`. Wrapped SVG text required concatenating text nodes for the disclosure assertion; a raw contiguous-string assertion was an observation error, not a missing disclosure. The app reported clipboard-write success, but the browser clipboard inspection returned empty. Actual system clipboard content was not verified; selectable copy text remains available.

Checked video direction replacement confirmation and keyboard switching to the ad-plan format. Text is explicitly labelled storyboard/draft, not an MP4 or campaign. Desktop light mode and phone dark mode inspected. Screenshots: `evidence/marketing-desktop-v1.png`, `evidence/marketing-mobile-v1.png`.

At 390px: no global horizontal overflow, input text 16px, poster preview approximately316px high. At 360px the full-size poster was1080px wide inside its264px scroll frame while document width remained345px, below the360px viewport. A separate browser tab on the actual public origin showed the public event without creator tools; directly requesting its marketing page showed Creator access unavailable. This confirms the guest view beyond source tests.

## Earlier mobile request

Populated 20-person manual setup thumbnail now shows enlarged artwork in its90px panorama. At390x844 document width390, Review bottom827.2, inside viewport. Screenshot updated: `evidence/mobile-bottom-review-v1.png`. Prior 360px, short-height and landscape checks remain valid; the landscape form had increased from43px to160px usable height. Purple favicon returned200 with image/svg+xml on the final production release. Physical phone keyboard, microphone and camera were not exercised.

## Additional requested preview

The subsequent v73 dashboard adds inert controls only. Final release dpl_J8VGks5G2uyMzyW55mVkTogRqiE4 is READY on the public alias, with88 source files and a passing production build. Actual published-event creator view contains34 new disabled type=button controls:19 sharing/channel options,5 media options,7 built-in agents and3 custom-agent controls. All are explicitly not connected. The original working Copy link and Promote actions remain separate. At the observed360px viewport the document width was345px and the new buttons were at least66px high, without global horizontal overflow. Screenshot: evidence/marketing-dashboard-preview-v1.png. No additional paid calls or external actions were made for this preview-only addition.
