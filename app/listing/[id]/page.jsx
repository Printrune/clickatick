import {notFound} from 'next/navigation';
import {headers} from 'next/headers';
import {localMode,localStore,loopbackHost} from '../../../lib/local-store.mjs';
import {connections,database} from '../../../lib/services';
import {parseListing} from '../../../lib/listing.mjs';
import ListingPreview from '../../../components/ListingPreview';
import {publishedEventPath} from '../../../lib/event-system.mjs';
import {readDemoListing} from '../../../lib/demo-service.mjs';
import DemoCheckout from '../../../components/DemoCheckout';
import CreatorPromotionPanel from '../../../components/CreatorPromotionPanel';
import '../../marketing.css';
import '../../demo-publishing.css';
export const dynamic='force-dynamic';
export default async function PublishedListing({params}){const {id}=await params;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))notFound();let demo;try{demo=await readDemoListing(id);}catch{throw new Error('This demo listing could not be loaded. Please try again shortly.');}if(demo&&process.env.CREATOR_NEON_CUTOVER_ENABLED==='true')return <div className="demo-public-page"><header className="demo-public-intro"><p>Earlier demo listing. No new demo orders are available. Existing confirmations remain accessible through their saved links.</p></header><div className="demo-public-grid"><ListingPreview draft={demo.draft} coverImage={demo.coverImage} published/></div></div>;if(demo)return <div className="demo-public-page"><header className="demo-public-intro"><p>This public snapshot lets you try choosing tickets and receiving a saved demo confirmation. No real purchase takes place.</p></header><div className="demo-public-grid"><ListingPreview draft={demo.draft} coverImage={demo.coverImage} published demoCheckout/><DemoCheckout listingId={id} draft={demo.draft} coverImage={demo.coverImage} available={Boolean(connections().demoPublishing)}/></div><CreatorPromotionPanel listingId={id}/></div>;
 if(!connections().publishing)notFound();let listing;try{if(localMode()&&!loopbackHost((await headers()).get('host')||''))notFound();const rows=localMode()?await(await localStore()).listing(id):await database(publishedEventPath(id));if(rows.length)listing=parseListing(rows[0].content);}catch{throw new Error('This listing could not be loaded. Please try again shortly.');}if(!listing)notFound();return <div className="public-listing"><ListingPreview draft={listing} published/></div>;}



