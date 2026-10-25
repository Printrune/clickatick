import Link from 'next/link';
import {redirect} from 'next/navigation';
import {readDemoCatalog} from '../lib/demo-service.mjs';
import './marketplace.css';
import NewDemoCatalog from '../components/NewDemoCatalog';
import CutoverCatalog from '../components/CutoverCatalog';
import PartnerEvents from '../components/PartnerEvents';

export const dynamic='force-dynamic';
const price=amount=>amount==='0'||amount==='0.00'?'Free':`From $${Number(amount).toFixed(2)}`;
export default async function Home({searchParams}){
 const query=await searchParams;
 if(Object.hasOwn(query||{},'start'))redirect('/creator');
 if(process.env.CREATOR_NEON_CUTOVER_ENABLED==='true')return <><CutoverCatalog home/><PartnerEvents/></>;
 let catalog=[],unavailable=false;
 try{catalog=await readDemoCatalog();}catch{unavailable=true;}
 return <div className="marketplace-page"><section className="marketplace-hero"><div><h1>The ticket platform that isn’t ripping anyone off.</h1><p className="marketplace-promise">Keep 90%. Pay with anything.</p><p className="marketplace-guest">Your guests pay the ticket price. Not a penny more.</p><p className="marketplace-note">Explore public event demos, or create your own tickets through a conversation. Checkout is simulated; payment methods are not connected yet.</p><div className="marketplace-actions"><Link href="/discover">Discover events <span aria-hidden="true">↗</span></Link><Link href="/creator">Create tickets <span aria-hidden="true">✦</span></Link></div></div><div className="marketplace-ticket-art" aria-hidden="true"><div className="marketplace-ticket-back">ADMIT ONE <b>✦</b></div><div className="marketplace-ticket-front"><span>clickatick</span><strong>YOUR NEXT<br/>EVENT</strong><small>FIND IT · MAKE IT · SHARE IT</small></div></div></section>{process.env.NEXT_PUBLIC_NEON_DEMO_CATALOG_ENABLED==='true'&&<NewDemoCatalog/>}<section className="marketplace-featured" aria-labelledby="featured-title"><div className="marketplace-featured-heading"><div><h2 id="featured-title">Events to explore</h2><p>Public listings with a demo ticket checkout.</p></div><Link href="/discover">See all events <span aria-hidden="true">↗</span></Link></div>{unavailable?<div className="marketplace-state" role="alert"><h3>Events are temporarily unavailable.</h3><p>You can still start creating event tickets.</p><Link href="/creator">Create tickets</Link></div>:catalog.length===0?<div className="marketplace-state"><h3>No events have been published yet.</h3><p>Start with an idea. The assistant will help you make a demo listing.</p><Link href="/creator">Create tickets</Link></div>:<div className="marketplace-grid">{catalog.slice(0,6).map(item=><Link className="marketplace-event" href={`/listing/${item.id}`} key={item.id}><span className="marketplace-event-art" aria-hidden="true">✦</span><span className="marketplace-event-content"><small>{item.type==='activity'?'Activity':'Event'} · Demo</small><strong>{item.title}</strong><span>{item.location}</span><span>{item.scheduleLabel}</span><b>{price(item.price)} <span aria-hidden="true">↗</span></b></span></Link>)}</div>}</section><section className="marketplace-create"><div><h2>Your event starts with a conversation.</h2><p>Tell clickatick your idea. Review the event and ticket details before publishing a demo listing.</p></div><Link href="/creator">Create my event <span aria-hidden="true">↗</span></Link></section></div>;
}

