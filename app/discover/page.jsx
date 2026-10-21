import Link from 'next/link';
import {readDemoCatalog} from '../../lib/demo-service.mjs';
import './discover.css';
import NewDemoCatalog from '../../components/NewDemoCatalog';
import CutoverCatalog from '../../components/CutoverCatalog';

export const dynamic='force-dynamic';
export const metadata={title:'Discover events',description:'Browse public clickatick event and activity demos.'};

const queryValue=value=>typeof value==='string'?value:Array.isArray(value)&&typeof value[0]==='string'?value[0]:'';
const normalize=value=>value.trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
const priceLabel=price=>price==='0.00'||price==='0'?'Free':`From $${Number(price).toFixed(2)}`;

export default async function Discover({searchParams}){
 const params=await searchParams;
 const q=queryValue(params?.q).slice(0,100).trim();
 const type=['event','activity'].includes(queryValue(params?.type))?queryValue(params.type):'';
 if(process.env.CREATOR_NEON_CUTOVER_ENABLED==='true')return <CutoverCatalog initialQuery={q} initialType={type}/>;
 let listings=[],unavailable=false;
 try{listings=await readDemoCatalog();}catch{unavailable=true;}
 const needle=normalize(q);
 const results=unavailable?[]:listings.filter(item=>(!type||item.type===type)&&(!needle||[item.title,item.description,item.location].some(value=>normalize(value).includes(needle))));
 return <div className="discover-page">
  <header className="discover-intro"><div><h1>Find your next event.</h1><p>Explore events and activities made with clickatick. Ticket checkout is a demo. No payment or admission ticket is created.</p></div><Link className="discover-create" href="/creator">Create tickets <span aria-hidden="true">↗</span></Link></header>
  <form className="discover-filters" action="/discover" method="get" role="search">
   <label htmlFor="discover-q">Search events and locations</label>
   <div className="discover-filter-row"><input id="discover-q" name="q" type="search" maxLength={100} defaultValue={q} placeholder="Try a title or location"/><label htmlFor="discover-type">Type</label><select id="discover-type" name="type" defaultValue={type}><option value="">All types</option><option value="event">Events</option><option value="activity">Activities</option></select><button type="submit">Find events</button></div>
  </form>
  {process.env.NEXT_PUBLIC_NEON_DEMO_CATALOG_ENABLED==='true'&&<NewDemoCatalog/>}
  {unavailable?<section className="discover-message" role="alert"><h2>Events are temporarily unavailable.</h2><p>Please try again shortly. Your ticket draft is unaffected.</p></section>:listings.length===0?<section className="discover-message"><h2>No events have been published yet.</h2><p>Create the first event or activity demo.</p><Link href="/creator">Create tickets</Link></section>:results.length===0?<section className="discover-message"><h2>No events match your search.</h2><p>Try a different title, location, or event type.</p><Link href="/discover">Clear filters</Link></section>:<section className="discover-results" aria-label="Published event demos"><div className="discover-results-heading"><h2>{results.length===1?'1 event or activity':`${results.length} events and activities`}</h2><p>Each listing has a simulated checkout.</p></div><div className="discover-grid">{results.map(item=><Link className="discover-card" href={`/listing/${item.id}`} key={item.id}><span className="discover-card-art" aria-hidden="true"><span>✦</span><i/></span><span className="discover-card-body"><span className="discover-card-type">{item.type==='activity'?'Activity':'Event'} · Demo</span><strong>{item.title}</strong><span className="discover-card-description">{item.description||'See event details and choose demo tickets.'}</span><span className="discover-card-meta">{item.scheduleLabel}</span><span className="discover-card-meta">{item.location}</span><span className="discover-card-bottom"><b>{priceLabel(item.price)}</b><span>View event <span aria-hidden="true">↗</span></span></span></span></Link>)}</div></section>}
 </div>;
}

