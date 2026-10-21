import {notFound} from 'next/navigation';
import PublicEventExperience from '../../../components/PublicEventExperience';
import '../public-event.css';
export const dynamic='force-dynamic';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function EventPage({params}){const {id}=await params;if(!UUID.test(id))notFound();const revisions=process.env.PUBLISHED_REVISIONS_ENABLED==='true';return <PublicEventExperience eventId={id} promotionsEnabled={revisions&&process.env.PROMOTIONS_DEMO_ENABLED==='true'} referralsEnabled={revisions&&process.env.REFERRALS_DEMO_ENABLED==='true'}/>;}
