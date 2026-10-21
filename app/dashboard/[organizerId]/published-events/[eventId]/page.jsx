import {isRouteUuid} from '../../../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import OwnerPublishedEvent from '../../../../../components/OwnerPublishedEvent';
import '../../../../organizer.css';
export const dynamic='force-dynamic';
export default async function OwnerPublishedPage({params}){const {organizerId,eventId}=await params;if(!isRouteUuid(organizerId)||!isRouteUuid(eventId))notFound();const revisions=process.env.PUBLISHED_REVISIONS_ENABLED==='true';return <OwnerPublishedEvent organizerId={organizerId} eventId={eventId} promotionsEnabled={revisions&&process.env.PROMOTIONS_DEMO_ENABLED==='true'} referralsEnabled={revisions&&process.env.REFERRALS_DEMO_ENABLED==='true'}/>;}

