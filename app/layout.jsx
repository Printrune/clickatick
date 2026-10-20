import './globals.css';
import './bubble.css';import Chrome from '../components/Chrome';import {site,indexable} from '../lib/site';
import './theme.css';
import {THEME_BOOTSTRAP} from '../lib/theme.mjs';
export const metadata={title:{default:site.business.name,template:`%s | ${site.business.name}`},description:site.business.description,robots:{index:indexable,follow:indexable}};
export default function RootLayout({children}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:THEME_BOOTSTRAP}}/></head><body style={{'--accent':site.brand.accent,'--ink':site.brand.ink,'--paper':site.brand.paper}}><Chrome>{children}</Chrome></body></html>}
