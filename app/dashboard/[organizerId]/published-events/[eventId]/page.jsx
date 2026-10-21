import {isRouteUuid} from '../../../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import OwnerPublishedEvent from '../../../../../components/OwnerPublishedEvent';
import '../../../../organizer.css';
export const dynamic='force-dynamic';
export default async function OwnerPublishedPage({params}){const {organizerId,eventId}=await params;if(!isRouteUuid(organizerId)||!isRouteUuid(eventId))notFound();return <OwnerPublishedEvent organizerId={organizerId} eventId={eventId}/>;}

