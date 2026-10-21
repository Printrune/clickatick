# Spoken date clarification verification v1

Shared brief: brief/project.json v57. Owner report: the deployed voice conversation paused after answering “2 days before Halloween”. Screenshot shows “Check the individual dates.” and “The agent could not reply.”

## Story and reproduced boundary

Spoken answer → Workspace chat request → Claude structured listing → listing validation → spoken follow-up → reopened microphone.

The current route validates the model schedule as a complete local date-time. Date-only and relative strings fail `parseListing`, become HTTP 400, and make the voice controller pause. The frontend correctly preserves the answer on request failures; routine semantic clarification belongs in a successful conversational reply.

## Approved repair

Keep Claude, the existing voice controller and UI. Backend and Frontend agree contract/date-recovery-v1.md before edits. Reject untrusted request data and genuine provider failures as before. Recover malformed model schedules into a validated retained schedule and one clarification question, without a paid retry or invented date/time. Test the actual route with mocked upstream data and use a labelled audio fixture for the browser walkthrough.

## Pending evidence

Contract agreement, regression outputs, production build, browser clarification loop, deployment readiness and public verification. No physical microphone or paid AI calls are implied by fixture results.

## Scope superseded before deployment

The owner subsequently required a fundamental repair across every field. This date-only path was tested locally but not deployed. Its helper was replaced by the agreed conversation-patches boundary. Final release evidence belongs to frontend/conversation-reliability-verification-v1.md.
