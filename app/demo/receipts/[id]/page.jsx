import {notFound} from 'next/navigation';
import PublicDemoReceipt from '../../../../components/PublicDemoReceipt';
import '../../../events/public-event.css';
export const dynamic='force-dynamic';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function ReceiptPage({params}){const {id}=await params;if(!UUID.test(id))notFound();return <PublicDemoReceipt receiptId={id}/>;}
