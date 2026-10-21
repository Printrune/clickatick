import {isRouteUuid} from '../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import BrandDashboard from '../../../components/BrandDashboard';
import '../../organizer.css';
export const dynamic='force-dynamic';
export default async function BrandPage({params}){const {organizerId}=await params;if(!isRouteUuid(organizerId))notFound();return <BrandDashboard organizerId={organizerId}/>;}

