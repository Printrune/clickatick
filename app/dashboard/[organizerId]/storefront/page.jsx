import {isRouteUuid} from '../../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import StorefrontEditor from '../../../../components/StorefrontEditor';
import '../../../organizer.css';
import '../../../a5.css';
export const dynamic='force-dynamic';
export default async function StorefrontPage({params}){const {organizerId}=await params;if(!isRouteUuid(organizerId))notFound();return <StorefrontEditor organizerId={organizerId}/>;}

