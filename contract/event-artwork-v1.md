# Event artwork contract v1

Status: prospective PM interface for Frontend and Backend before implementation. Brief `brief/project.json` v77. Owner approved one image on both the published listing and the demo ticket, and approved Vercel AI Gateway within the existing USD 10 total AI test limit. No real admission ticket or payment is implied.

## Immutable scene image at publication

The browser captures the reviewed `EventScene` artwork as a bounded JPEG after scene transitions settle. It never uploads the camera frame. It may include only the drawn avatar, including derived appearance traits. `draft.coverImage` is optional and has exact keys `{mime:'image/jpeg',dataUrl,origin:'scene'}`. It is at most 450,000 data-URL characters, with decoded image size at most 340,000 bytes. `parseListing` validates and retains it. Existing drafts/listings without this field continue to work. A saved publish retry must reuse the same image bytes and publication intent; it must not recapture a different image under the same ID. If capture fails, publication remains possible with the existing venue photo or no cover.

The published page displays `coverImage` first; existing venue photo is the fallback. The guest demo ticket and saved confirmation display the same image and an unmistakable `Demo only · Not valid for admission` label. Legacy records need no migration.

## Optional realistic image

On the private creator page, `Generate realistic image` is an explicit action. It uses Vercel AI Gateway only when gateway credit has been confirmed and a server-side feature flag is enabled. No request runs during drafting, publication, or page load. The prompt uses bounded published event facts and the saved scene image as a reference when the selected model supports image editing. No original camera photo, raw conversation, private access token, or personal details go to the provider. If image editing is unsupported, generate from event facts and clearly label that limitation.

`POST /api/demo/listings/[id]/artwork` accepts one bounded idempotency request ID. It checks same origin and the existing creator cookie before reading private data. It claims the one allowed generation attempt for that listing before calling the provider. The request either returns a validated image or a clear unavailable/error status. Refreshes and duplicate requests must not make a second provider call. A successful image is saved privately in Blob and shown publicly through the listing and demo ticket views. The immutable listing record stays unchanged; the generated image is a separate overlay. No generated image can imply that a fictional demo event is real. On Gateway failure or zero confirmed credit, the original scene image remains visible.

Backend owns parsing, storage, quota, provider call, API route, and public projection. Frontend owns capture, listing/ticket rendering, and the creator control. No live provider call until a read-only balance check confirms available credit; any test counts toward the existing USD 10 total allowance.
