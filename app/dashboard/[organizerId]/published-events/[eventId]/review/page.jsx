import {notFound} from 'next/navigation';
import {isRouteUuid} from '../../../../../../lib/route-uuid.mjs';
import PublishedRevisionWorkspace from '../../../../../../components/PublishedRevisionWorkspace';
import '../../../../../organizer.css';
import '../../../../../a6.css';
export const dynamic='force-dynamic';
export default async function RevisionReviewPage({params}){const {organizerId,eventId}=await params;if(!isRouteUuid(organizerId)||!isRouteUuid(eventId))notFound();return <PublishedRevisionWorkspace organizerId={organizerId} eventId={eventId} mode="review"/>;}
