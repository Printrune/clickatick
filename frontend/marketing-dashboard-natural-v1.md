# Creator marketing dashboard layout, v1

Brief: `brief/project.json` v77. Scope: the creator-only dashboard preview on newly published event pages. The ticket details and demo ticket flow remain above it.

| Before | After | Why |
| --- | --- | --- |
| Bordered gradient header and three rounded section cards | Open heading and three sections divided by subtle rules | The reading order comes from type and spacing instead of nested boxes. |
| 34 equally prominent bordered tiles | Plain channel/tool rows with small colored symbols and a bottom rule | The controls read as a browsable catalog, with less visual noise. |
| Corner arrow on every control | No arrow; hover and press give restrained local feedback | An arrow suggested navigation that these previews do not provide. |
| Custom agent tools in a dashed panel | Indented subsection in the agent section | Keeps related controls together without another container. |

The same 34 buttons remain keyboard accessible and clickable with no handlers. All retain their `Not connected` text and accessible preview-only labels. At tablet sizes, headings stack above their controls; on phones, the controls use two columns, then one below 350px. Reduced-motion preference removes translation.

Changed `components/MarketingDashboardPreview.jsx` and `app/marketing.css`. No API or service connection changed.

Verification: `node node_modules/next/dist/bin/next build` passed in the permitted elevated Windows environment. The restricted attempt failed only because Turbopack could not create a Windows junction. Browser visual review and production deployment remain with the Product Manager.
