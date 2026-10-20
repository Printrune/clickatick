# TicketNest shared brief, version 46

Positioning: approved. Product scope: draft.

## Business

clickatick helps local event and activity organizers create ticket listings quickly through voice or chat.

Customer: Independent local event organisers and activity providers in the United States.
Offer: Quick ticket setup through a conversation, with event details and ticket types prepared for review.
Pricing: 10% platform fee. Business-funded referral rewards come from the remaining 90%. Payment processing fee allocation remains to be confirmed.

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
- Use the supplied ticketing system for event listings and ticket types, not admission ticket issuance.
- Start with a new database. Do not reuse the exported project database or data.
- Remove Lovable-specific branding, dependencies, hosted project mapping, and gateway references.
- Owner superseded the paid USD 10 allowance: free plans only, no paid AI top-ups or upgrades. Use Vercel AI Gateway free credits.
- Owner requested development on this computer first after Vercel authorization remained blocked. Local-only storage and organiser testing will precede hosted deployment.
- Owner cancelled local AI/Ollama setup. Leave AI disconnected for now; choose Vercel AI Gateway or Claude API later. Continue local event and ticket-type backend.
- Owner requested connecting TicketNest to Vercel. Separate project created and source deployed; AI and hosted persistence stay disabled.
- Owner requested adding Vercel free AI to the deployed app and confirmed free credits available with automatic top-ups off.
- Owner changed AI provider to Claude API and authorized up to USD 10 total testing. No automatic top-ups.
- Owner requested an evolving illustrated homepage: human with idea bubble, click to select voice or typing, scene develops from conversational event details. Example: Halloween guided tour, guide and audience matching capacity, paper or phone tickets based on selected format. Futuristic, fast, smooth visual treatment. Ask clarifying questions one at a time before final design.
- Owner approved stylised 3D if smooth, 2D fallback; expanded idea bubble contains conversation and scene. Automatic scene changes. Neutral character, no appearance menus. Optional camera snapshot guides visible likeness, no gender inference. Owner said yes make it so.
- Owner saved a private Claude API key in Vercel and confirmed no more than USD 10 prepaid API credits with automatic refills disabled. Production activation authorized.
- Owner requested a front-page-only audit and a complete problem list, especially for the visual scene. Review first; no implementation changes requested in this turn.
- Owner approved fixing the front-page audit, starting with visuals: smoothly expand the bubble, keep the conversation inside it, and make the scene feel alive as answers arrive.
- Owner prioritizes quick, hassle-free ticket creation. Every accepted answer should visibly add to the evolving illustration. On bubble click request camera permission, automatically capture one frame, adapt only the main avatar from visible features, never show the actual photo. Keep the process seamless.
- Owner wants interactive spoken conversation: agent asks questions aloud, listens to the user answer, then asks the next question. Replace isolated dictation/manual-send voice behavior.
- Owner renamed the product to clickatick, using lowercase spelling.
- Voice mode must open the microphone immediately after user entry and permission, allowing immediate speech like a voice chat.
- Owner requested five clickatick logo versions with purple symbols and purple name. Final version not selected.
- Owner selected logo concept1: purple ticket with cursor cutout and purple lowercase wordmark.
- Owner approved reusable business or attraction location with address, photo and precise map marker. A same-location checkbox reuses these details; otherwise event address, photo and map marker fields appear.
- Owner approved organiser-defined concession categories and a total ticket quantity. Numbered seats and arena seating are excluded from this iteration.
- Include separate free-text fields for participation restrictions and organiser disclaimer. Restrictions, including any organiser-defined minimum age or participation conditions, must be clear on the listing.
- Owner requests a disclaimer on every ticket and activity-aware suggested disclaimer/restriction text for organiser review. Suggested terms remain editable drafts and are not represented as guaranteed liability protection.
- Owner requires a precise map pin as well as an address for business and event locations, connected to an external maps provider such as Google Maps or Bing Maps. Provider and synchronization behavior remain to be specified.
- Owner requires automatic digital confirmation for every completed ticket sale to the consumer.
- Owner requests a customer referral scheme with a personal referral code and an immediate reward for each resulting ticket purchase. Each business controls its reward offer. Example: 10% of a USD 55 ticket is USD 5.50.
- Owner changed the platform fee from 1% to 10%, intending businesses to retain 90%. Whether referral rewards and payment processing fees reduce that 90% remains unresolved.
- Owner confirmed referral rewards are funded entirely by the business from its 90% share of each ticket. The business sets the reward amount. The platform retains its 10% fee.
- Owner confirmed each event or attraction has an editable numeric referral percentage chosen by its business, with no fixed preset percentage.
- Owner approved preparing a simple business setup flow and consumer purchase flow covering map pins, digital confirmations and referral rewards.
- Owner clarified referral payout happens only after the event has occurred. If the event is cancelled for any reason, no referral payout occurs. This supersedes any interpretation of immediate cash payout at purchase.

## Acceptance criteria

- Start a listing draft without an account.
- Have a natural conversation through live artificial intelligence using voice or text; show and speak agent replies.
- Accept several details in one answer, remember supplied details, and ask focused follow-up questions only when needed.
- Support single-date events, activity dates, weekly schedules, and multiple ticket types with separate prices and quantities.
- Review and edit the listing draft; require login and an explicit Publish action before publication. Payments are outside the demonstration.

## Open questions

- Brand name availability remains unchecked.
- Before public activation: verify provider/model maximum costs, anonymous abuse controls, database permissions, email delivery, and real publication.
- Should concession categories draw from one shared total ticket pool, or each have a separate fixed allocation?
- Admission ticket issuance was excluded from the current demo; disclaimer rendering on issued tickets is a future ticket-output requirement unless scope is expanded.
- Digital confirmations and referral rewards require a purchase flow beyond the current listing-and-ticket-types demo. Delivery channel and external map behavior remain to be defined.
- How are third-party payment processing fees allocated?
- Define exact payout timing after event completion, later refund/dispute handling, rescheduling and the booked occurrence for repeating activities. Immediate pending-reward visibility is proposed, not yet approved.

## Sources

- ticket-tailor-ai: [Ticket Tailor conversational event creation](https://help.tickettailor.com/en/articles/16983272-how-can-i-build-a-ticket-tailor-event-with-ai), accessed 2026-10-17.
- eventbrite-fees: [Eventbrite ticketing fees](https://www.eventbrite.com/help/en-us/articles/755615/how-much-does-it-cost-for-organizers-to-use-eventbrite/), accessed 2026-10-17.
- peek-pro: [Peek Pro activity booking platform](https://support.peek.com/hc/en-us/articles/44207663902868-What-Is-Peek-Pro), accessed 2026-10-17.
- research-v1-ticket-tailor-pricing: [Ticket Tailor pricing models; fetched currency GBP, no US amount verified](https://www.tickettailor.com/pricing), accessed 2026-10-17.
- research-v1-google-form-share: [Google Forms publication and sharing](https://support.google.com/docs/answer/2839588?hl=en), accessed 2026-10-17.
- research-v1-google-form-responses: [Google Forms responses linked to a spreadsheet](https://support.google.com/docs/answer/2917686?hl=en), accessed 2026-10-17.

## Implementation limits

Microphone-first voice chat deployed. Simulated end-to-end voice flow and live entry verified; physical microphone/audio remain unverified.
The local preview is not an approved published site.
