import {isRouteUuid} from '../../../../lib/route-uuid.mjs';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import BrandMediaLibrary from '../../../../components/BrandMediaLibrary';
import '../../../organizer.css';
import '../../../a5.css';
import '../../../a3-media.css';
export const dynamic='force-dynamic';
export default async function MediaPage({params}){const {organizerId}=await params;if(!isRouteUuid(organizerId))notFound();return <div className="organizer-page"><div className="organizer-heading"><Link href={`/dashboard/${organizerId}`}>← Brand dashboard</Link><h1>Media library</h1><p>Store event images and private videos for this brand.</p></div><BrandMediaLibrary organizerId={organizerId}/></div>;}

