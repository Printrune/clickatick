import {isRouteUuid} from '../../../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import OwnerDraftEditor from '../../../../../components/OwnerDraftEditor';
import '../../../../organizer.css';
import '../../../../a3-media.css';
import '../../../../a6.css';
export const dynamic='force-dynamic';
export default async function EventDraftPage({params}){const {organizerId,eventId}=await params;if(!isRouteUuid(organizerId)||!isRouteUuid(eventId))notFound();return <OwnerDraftEditor organizerId={organizerId} eventId={eventId}/>;}



