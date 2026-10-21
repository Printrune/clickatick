import {isRouteUuid} from '../../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import BrandTeam from '../../../../components/BrandTeam';
import '../../../organizer.css';
import '../../../a5.css';
export const dynamic='force-dynamic';
export default async function TeamPage({params}){const {organizerId}=await params;if(!isRouteUuid(organizerId))notFound();return <BrandTeam organizerId={organizerId}/>;}

