import {isRouteUuid} from '../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import BrandStorefront from '../../../components/BrandStorefront';
import '../../brand-storefront.css';
export const dynamic='force-dynamic';
export default async function OrganizerPage({params}){const {organizerId}=await params;if(!isRouteUuid(organizerId))notFound();return <BrandStorefront organizerId={organizerId}/>;}

