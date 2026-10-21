# Creator marketing dashboard preview v1

Owner steering recorded by PM for brief73; brief72 was current when implementation began. This is an inert visual addition to the published event creator panel, with no API or data-shape changes.

## Changes

- Added MarketingDashboardPreview inside CreatorPromotionPanel, after its existing working Copy link and Promote this event actions.
- Preserved authoritative protected-GET ownership. The entire panel, including these previews, remains absent for guests until the server confirms creator access.
- Social/channel previews: Facebook, Instagram, TikTok, YouTube, X, Threads, LinkedIn, Pinterest, Snapchat, WhatsApp, Telegram, Reddit, Discord, Bluesky, Mastodon, WeChat, LINE, Email and Custom channel.
- Media previews: Generate image, Edit image, Create poster, Generate video and Animate image.
- Built-in agent previews: Social Media Manager, Content Creator Design, Content Creator Video, Performance Marketer, Copywriter, Email Marketer and Analytics Agent. Custom placeholders cover Add your own agent, pasted prompt and API connection.
- Every new control is disabled type=button, labeled Not connected, and has no click handler, data entry, generation, installation, upload, account connection, provider call or external send.
- Purple theme tokens support saved light/dark mode; flexible grids wrap at mobile widths with64px or larger targets and explicit readable disabled states.

## Evidence and remaining proof

Installed Next SWC parsed both new MarketingDashboardPreview and changed CreatorPromotionPanel successfully. No tests mirroring static markup were added. PM owns production build and360/390px browser checks. Frontend started no preview processes, deployed nothing and made no paid requests.

Files: components/MarketingDashboardPreview.jsx; components/CreatorPromotionPanel.jsx; app/marketing.css.
