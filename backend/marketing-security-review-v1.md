# Marketing security review v1

Date: 2026-10-18. Reviewer: Product Manager. Brief v72 and prospective contract/marketing-v1.

Inspected the actual creator-cookie helpers, immutable publishing change, marketing service, provider adapter and three marketing route handlers. Checked focused test output and the complete 254-test passing run in evidence/marketing-full-tests-final-v1.txt.

The public listing projection omits creatorHash. New hashes are bound inside the immutable listing record, so existing v1 listings cannot be claimed by adding a token later. Retried token-bearing publication checks both content and the original hash. Cookie values do not enter public URLs or exports. Cookies are HttpOnly, SameSite Strict and Secure in production, with a fixed thirty-day expiry. Timing-safe comparisons check secrets. Marketing operations also check server-side expiry and revocation.

Each private read and mutation authorizes the capability. Responses are private/no-store with Vary Cookie, including errors. Mutations check same origin and streamed request limits. A public identifier or guessed UUID cannot read or save private versions. The public event remains readable after revocation. Cross-creator, visitor, expiry and revocation behavior has meaningful tests, but live persistence is still pending at this review time.

Versions and approval records are separate immutable objects. A saved version is tied to the listing fingerprint and fixed destination. Identical retries converge; conflicting content cannot overwrite a version. A new edited version needs its own approval. The demo limits versions to twenty per listing.

Only explicit refinement calls can contact Claude. The adapter sends public listing facts and draft text, excludes embedded photos, uses the existing key/model/budget gate, has no tools or URL fetching, limits request/output size and returns a bounded candidate. Durable atomic claims precede calls. Limits are three attempts per listing and twenty globally. Cached successful results avoid duplicate calls; failed or uncertain attempts consume their claim. These limits do not measure prior account spend. The previously approved prepaid account limit remains the monetary control.

Provider instructions alone cannot guarantee truthful marketing copy. Candidate text requires organizer review. Fixed demo disclosure and the canonical public destination are added outside editable output by the export helper. Photo embedding permits only validated raster data URLs; other text is XML escaped. Full rendering and real download inspection remain frontend verification work.

No unresolved backend blocker found in the inspected scope. Remaining limits are deliberate: no cross-device recovery, no legacy ownership migration, no external social publishing, no real payment or video renderer. This report does not claim live provider or Blob success.
