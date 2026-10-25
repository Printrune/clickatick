import Link from 'next/link';
import {redirect} from 'next/navigation';
import './marketplace.css';
import CutoverCatalog from '../components/CutoverCatalog';
import PartnerEvents from '../components/PartnerEvents';
import {pageMeta} from '../lib/site';

export const dynamic='force-dynamic';
export const metadata=pageMeta('Find events and activities near you','Explore events across the U.S. View locations, save ideas to an activity planner, and visit the ticket provider when you are ready to buy.','/');
export default async function Home({searchParams}){
 const query=await searchParams;
 if(Object.hasOwn(query||{},'start'))redirect('/creator');
 if(process.env.CREATOR_NEON_CUTOVER_ENABLED==='true')return <><CutoverCatalog home/><PartnerEvents/></>;
 return <div className="marketplace-page"><section className="marketplace-hero"><div><h1>The ticket platform that isn’t ripping anyone off.</h1><p className="marketplace-promise">Keep 90%. Pay with anything.</p><p className="marketplace-guest">Your guests pay the ticket price. Not a penny more.</p><p className="marketplace-note">Explore events or create your own tickets through a conversation. Clickatick checkout is simulated; partner tickets are sold by their provider.</p><div className="marketplace-actions"><Link href="/map">Explore the event map <span aria-hidden="true">↗</span></Link><Link href="/creator">Create tickets <span aria-hidden="true">✦</span></Link></div></div><div className="marketplace-ticket-art" aria-hidden="true"><div className="marketplace-ticket-back">ADMIT ONE <b>✦</b></div><div className="marketplace-ticket-front"><span>clickatick</span><strong>YOUR NEXT<br/>EVENT</strong><small>FIND IT · MAKE IT · SHARE IT</small></div></div></section><PartnerEvents/><section className="marketplace-create"><div><h2>Your event starts with a conversation.</h2><p>Tell clickatick your idea. Review the event and ticket details before publishing a demo listing.</p></div><Link href="/creator">Create my event <span aria-hidden="true">↗</span></Link></section></div>;
}

