# TicketNest shared brief, version 9

Positioning: approved. Product scope: draft.

## Business

TicketNest helps independent US organisers create event and activity listings through voice or chat. Its agent asks questions and prepares a draft for review.

Customer: Independent local event organisers and activity providers in the United States.
Offer: Create event and activity listing drafts through a live voice or text conversation.
Pricing: 1% of the ticket price, plus separate third-party payment processing fees.

## Recorded decisions

- Agent installation means adding workshop bots to Grok, not installing software on customer devices.
- Support event organisers and activity providers equally.
- Custom agents and connected services are the product focus.
- First workflow: the agent asks questions and creates a listing from answers.
- Use live artificial intelligence, voice input, text chat, and spoken questions.
- Organisers review listing drafts before publication.
- Pricing: 1% of ticket price; payment provider fees are separate.
- Working name: TicketNest. Initial market: United States.
- First audience: independent local providers.
- Support single-date events and activities with several bookable dates.
- Activity schedules support individually entered dates and repeating schedules.
- No account is required to create a draft; login is required to publish.
- The agent must have a natural conversation, rather than follow a rigid questionnaire.
- Publishing is included after login and organiser review. Payments are outside the demonstration.
- Published listings must be publicly accessible. Owner permits Vercel or GitHub hosting based on live AI requirements.
- Owner approved paid AI usage with a maximum total demonstration budget of USD 10. No AI service account exists yet.
- Owner confirmed direct AI service connection first. Defer CLIProxyAPI until the final optional integration step.

## Acceptance criteria

- Start a listing draft without an account.
- Have a natural conversation through live artificial intelligence using voice or text; show and speak agent replies.
- Accept several details in one answer, remember supplied details, and ask focused follow-up questions only when needed.
- Support single-date events and activities with individual dates or repeating schedules.
- Review and edit the listing draft; require login and an explicit Publish action before publication. Payments are outside the demonstration.

## Open questions

- Live AI and voice service availability must be verified before implementation.
- Brand name availability remains unchecked.

## Sources

- ticket-tailor-ai: [Ticket Tailor conversational event creation](https://help.tickettailor.com/en/articles/16983272-how-can-i-build-a-ticket-tailor-event-with-ai), accessed 2026-10-17.
- eventbrite-fees: [Eventbrite ticketing fees](https://www.eventbrite.com/help/en-us/articles/755615/how-much-does-it-cost-for-organizers-to-use-eventbrite/), accessed 2026-10-17.
- peek-pro: [Peek Pro activity booking platform](https://support.peek.com/hc/en-us/articles/44207663902868-What-Is-Peek-Pro), accessed 2026-10-17.

## Implementation limits

The live AI, account, database, and public deployment connections are not configured.
The local preview is not an approved published site.
