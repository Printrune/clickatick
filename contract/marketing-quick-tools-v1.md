# Marketing quick tools contract v1

Brief: `brief/project.json` v78. Owner approved functional marketing tools that are quick to add. The existing published listing and creator capability remain the source of event facts and access.

This change is client-side only. No API routes, storage schema, AI budget, payment flow, social account, or agent connection changes. Share controls open a user-initiated composer where supported, or copy a prepared listing link or caption. They never publish on the owner's behalf. Media controls link to the existing marketing workspace's social, poster, video-script, and ad-plan editors; no new generated image or rendered video is claimed. Existing save, review, approve, copy, and SVG/text download gates remain intact. Unsupported integrations remain visibly unavailable, not apparently functional.

The marketing workspace may accept a `format` query value of `social`, `poster`, `video`, or `ad-plan`; invalid values use `social`. The public listing URL is `promotionUrl(listingId)`. Any promotional text includes the existing demo disclosure. The creator panel passes only `listingId` to the dashboard; it may load the listing through existing authorized `/api/marketing/[id]` if needed. No backend interface changes are required.
