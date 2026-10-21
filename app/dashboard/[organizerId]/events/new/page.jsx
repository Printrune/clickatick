import {isRouteUuid} from '../../../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import OwnerDraftEditor from '../../../../../components/OwnerDraftEditor';
import '../../../../organizer.css';
import '../../../../a3-media.css';
import '../../../../a6.css';
export const dynamic='force-dynamic';
export default async function NewEventPage({params,searchParams}){const {organizerId}=await params,{source}=await searchParams;if(!isRouteUuid(organizerId))notFound();return <OwnerDraftEditor organizerId={organizerId} source={source==='creator'?'creator':'manual'}/>;}



