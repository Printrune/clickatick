import site from '../content/site.json';import {ready,canIndex} from './brief.mjs';
export {site};export const indexable=canIndex(site),articles=site.articles.filter(ready),solutions=site.solutions.filter(ready),aboutReady=ready(site.about);
export const absolute=(path='/')=>new URL(path,site.siteUrl||'http://localhost:3000').toString();
export const pageMeta=(title,description,path,approved=true)=>({title,description,alternates:{canonical:indexable?absolute(path):undefined},robots:{index:indexable&&approved,follow:indexable&&approved}});
export const contentSources=x=>site.positioning.sources.filter(s=>x.sourceIds?.includes(s.id));
