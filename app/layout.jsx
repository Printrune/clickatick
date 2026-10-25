import './globals.css';
import './bubble.css';import Chrome from '../components/Chrome';import {site,indexable} from '../lib/site';
import './theme.css';
import {THEME_BOOTSTRAP} from '../lib/theme.mjs';
import {ClerkProvider} from '@clerk/nextjs';
export const metadata={metadataBase:new URL(site.siteUrl||'http://localhost:3000'),title:{default:site.business.name,template:`%s | ${site.business.name}`},description:site.business.description,robots:{index:indexable,follow:indexable}};
export default function RootLayout({children}){const content=<html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:THEME_BOOTSTRAP}}/></head><body style={{'--accent':site.brand.accent,'--ink':site.brand.ink,'--paper':site.brand.paper}}><Chrome>{children}</Chrome><p className="site-verification">Impact-Site-Verification: e12cd04e-9624-48c9-80de-07b0ccad8fee</p></body></html>;return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()&&process.env.CLERK_SECRET_KEY?.trim()?<ClerkProvider>{content}</ClerkProvider>:content;}
