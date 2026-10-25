import {indexable,absolute,articles,solutions,aboutReady} from '../lib/site';

export const dynamic='force-dynamic';

async function publishedEventUrls(){
  if(!process.env.DATABASE_URL||process.env.CREATOR_NEON_CUTOVER_ENABLED!=='true')return [];
  try{
    const {neon}=await import('@neondatabase/serverless');
    const rows=await neon(process.env.DATABASE_URL).query(`SELECT id,published_at FROM public_events WHERE status='published' ORDER BY published_at DESC,id DESC LIMIT 10000`);
    return rows.map(row=>({url:absolute(`/events/${row.id}`),lastModified:row.published_at}));
  }catch{return [];}
}

export default async function sitemap(){
  if(!indexable)return [];
  const paths=['/','/discover','/creator','/privacy',...(aboutReady?['/about']:[]),...(articles.length?['/insights']:[]),...(solutions.length?['/solutions']:[]),...articles.map(x=>`/insights/${x.slug}`),...solutions.map(x=>`/solutions/${x.slug}`)];
  return [...paths.map(path=>({url:absolute(path)})),...await publishedEventUrls()];
}
