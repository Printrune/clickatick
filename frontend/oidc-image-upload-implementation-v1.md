# Connected image upload frontend v1

Date: 2026-10-22. Brief read: `brief/project.json` v108. Frontend accepted `contract/oidc-image-upload-v1.md` before implementation. Backend owns the server route; this document records the frontend side.

`PrivateMediaPanel.jsx` now reads v6 ready images, creates a v6 image upload intent, sends one raw JPEG/PNG/WebP file of at most 4,000,000 bytes to the agreed authenticated server-upload route, and attaches the returned ready asset to the draft. It uses the v6 private preview URL. A retry keeps the same upload ID for the same file. Device-image recovery, reuse of saved brand images, and retrying a saved attachment remain available. The brand media library remains available for explicit deletion. `OwnerDraftEditor.jsx` now directs owners to the image panel.

The browser sets the `Content-Length` header when it sends the raw File. Client code does not set that restricted header. A browser that omits it will receive the server's recoverable validation error. Video upload remains a separate, disabled direct-upload path. Image availability is decided by the server's v6 capabilities and release gates; displaying the image panel does not imply that storage is connected.

Verification: `pnpm run build` compiled successfully outside the restricted Windows sandbox. An in-sandbox build failed only because Windows denied Next.js a sharp junction. A connected Preview image upload, draft attachment, and public image fetch have not yet been verified. Do not enable production image uploads until those checks pass.
