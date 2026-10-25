# Partner event detail contract v1

Brief: `brief/project.json` v108. Approved decision: Ticketmaster discovery events have a Clickatick detail page. The card opens that page in the same tab; only the explicit purchase action opens Ticketmaster in a new tab. Partner events do not use Clickatick checkout or the 10% Clickatick-created-ticket fee.

Route: `GET /partner-events/{id}` renders an event detail page. `{id}` is a bounded Ticketmaster event identifier, never a URL. The server requests `GET https://app.ticketmaster.com/discovery/v2/events/{id}.json` with the private `TICKETMASTER_API_KEY`, caches the response for 15 minutes, and returns a 404 page for missing/invalid IDs. Provider failure shows a retryable unavailable state without exposing the key.

The normalized page model contains only public event ID, title, direct HTTPS provider purchase URL, image/attribution, date and local time, venue/address, event category, and provider-supplied description/notes when present. An affiliate redirect supplied by the API is unwrapped to its direct Ticketmaster destination until partnership approval. The UI labels Ticketmaster as the ticket seller and sends users to that provider for final availability, fees and payment.

Frontend consumes the server-rendered model. Home cards use `/partner-events/{id}` as their link and never use `target="_blank"`. The buy action uses `target="_blank"` with `rel="noopener noreferrer"`. No partner event enters Clickatick's local listings database or demo checkout.
