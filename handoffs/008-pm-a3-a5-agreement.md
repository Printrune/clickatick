# PM handoff 008: A3 media and A5 storefront/team

Date: 2026-10-21. Source brief: `brief/project.json` v104.

Backend and Frontend agreed prospectively to `contract/integrated-phase-a3-media-v4.md` and `contract/integrated-phase-a5-v2.md`, with Frontend acceptance in `frontend/integrated-phase-a3-a5-agreement-v1.md`. The appended amendments in both contracts are authoritative. Implement independently owned backend and frontend files, then verify together.

Owner decisions carried forward: public brand URLs use stable generated IDs; 100 images and 10 videos per brand, videos up to 100 MB, within shared free Blob storage; successful uploads stay until explicit deletion; storefront and staff support multiple brands; staff editors prepare changes and owners approve publishing. Clerk and Neon are selected but not connected in this checkout. Email delivery, real payments, and live ticket issuance remain off. Current checkout is a clearly labelled demo.

PM engineering choices in A3 v4 bound uploads to 10 MB image source and 5 MB normalized output, initially accept MP4 H.264/AAC, limit upload intents to 10 per hour and two concurrent per brand, and gate public playback until connected private-range verification. These are implementation limits within, not replacements for, the owner's brand item maxima.

First implementation slice is A5 public storefront and private-link staff core. Keep all A5 flags off until schema and connected verification. A3 media implementation may follow in separate files and remains gated. Neither contract is evidence of a live integration.
