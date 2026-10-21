# Neon migration runner review v1

Date: 2026-10-21. Brief: `brief/project.json` v107. Owner approved a fresh Neon database. Scope: `backend/migrate-neon.mjs` applying committed migrations 001–007. This is a source review, not proof of a connected Neon run.

The runner is suitable for a **fresh** Neon database when invoked with the **unpooled** connection URL and Node 24. It reads the URL from standard input without writing it to disk or stdout, refuses a populated public schema lacking its ledger, sorts the seven migration files, hashes each file, uses a session advisory lock, and runs each migration plus ledger write in one transaction. The installed `@neondatabase/serverless` documentation says `Pool` uses WebSockets and supports interactive transactions. Node 24 here has a built-in `WebSocket`; older Node versions would require an explicit constructor. None of the seven SQL files contains a `CREATE INDEX CONCURRENTLY`, `VACUUM`, or another obvious transaction-prohibited top-level statement. Each file can be sent as a simple multi-statement query without bound parameters.

Before applying, run `inspect` against the exact target URL and confirm `tables:0`, `applied:[]`, and seven pending files. Then use `apply` with the same URL. A second `apply` should report seven verified files and no new changes. Finish with a read-only check of expected tables and the ledger count. Do not use a pooled URL for the advisory-lock and transaction sequence.

Two small caveats remain. `inspect` lists existing ledger filenames without checking their stored hashes; only `apply` detects a changed SQL file. The filename guard checks a count of seven and a numeric prefix, not the exact approved names. In the committed repository this is low risk, but the operator should inspect `git status` and the file list before the hosted run. Connection failure has no explicit timeout, so a network fault may need operator interruption; retry is safe because each migration and ledger row commit atomically.

No implementation edit was made during this review. The runner still needs a real Neon run and post-migration verification before any integrated feature flag is enabled.
