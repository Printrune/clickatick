# Conversational date recovery v1

Brief: brief/project.json v57. 2026-10-18.
PM and Frontend agreed this contract before implementation. Backend owns server files and server tests. Frontend owns controller regression tests and a labelled browser fixture.

## Failure and behavior

A Claude draft can include date-only or relative text in schedule.dates despite the required local date/time shape. The strict listing validator currently rejects this as HTTP400, pausing voice. Unknown date facts are normal conversation, rather than a service failure.

Success remains HTTP200 with {reply,draft,speech?}. For an invalid model-produced schedule, preserve the entire previously validated schedule. Retain other candidate fields only if the complete candidate with that original schedule passes listing validation. Replace the model reply with one focused date clarification so it cannot falsely claim the rejected schedule was saved. Sign optional speech from the replacement reply. The user's exact words remain in existing conversation history. Do not infer or save a year, time, or relative date in recovery. If a year is not established in the user conversation or saved schedule, ask which year. If a year is established and the start time is unknown, ask what time. Otherwise ask for an exact date. Weekly schedule errors ask one relevant start/end/time/day question.

No automatic provider retries or additional paid requests. Invalid request drafts, malformed non-schedule output, unreadable/incomplete provider output, credential, quota, network and service errors retain existing error responses. Frontend keeps those failures explicit. No browser interface change is required: a successful clarification is spoken and listening resumes normally.

Improve model boundary instructions: date-only values, relative date strings and placeholders cannot be written into schedule.dates; ask for missing year/time, keep confirmed schedule until all required facts are explicit. Schema descriptions document exact formats; runtime remains authoritative.

## Evidence

Mock the actual chat route and Claude fetch with screenshot input `2 days before Halloween`; cover relative/date-only/impossible dates, valid full dates, known-year follow-up, retained schedule/non-date fields, invalid non-date candidate, provider errors and optional speech. No paid service request or secret read.
