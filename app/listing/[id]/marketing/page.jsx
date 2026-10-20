import {notFound} from 'next/navigation';
import MarketingWorkspace from '../../../../components/MarketingWorkspace';
import '../../../marketing.css';
export const dynamic='force-dynamic';
export const metadata={title:'Promote your event',robots:{index:false,follow:false}};
export default async function MarketingPage({params}){const {id}=await params;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))notFound();return <MarketingWorkspace listingId={id}/>;}
