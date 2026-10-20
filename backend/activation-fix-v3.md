# Claude activation credential normalization v3

Brief version 25. PM production evidence: upstream 400 with safe generic markers `key, header`, rather than an authentication 401. No raw message or key was exposed.

Root configuration defect found: readiness checks a trimmed key, but request construction previously sent its untrimmed value. The adapter now trims outer whitespace and uses that same normalized value in the x-api-key header. It rejects internal whitespace, quotes, assignments, bearer prefixes, and other characters outside the key token alphabet before any network call. It does not extract a key from a pasted assignment or silently repair quotation marks.

Provider 400 key/header errors now produce a fixed credential-configuration instruction. The adapter never prints or returns the key. No provider request shape/model change.

44 mocked adapter tests passed, including whitespace normalization, six malformed credential examples blocked before network, and safe provider-header diagnostics. No real call, key read, or spending by this specialist. A new production deployment is required. This normalization fix does not prove that the deployed credential is otherwise valid.
