import {notFound} from 'next/navigation';
import {readDemoReceipt} from '../../../lib/demo-service.mjs';
import DemoReceipt from '../../../components/DemoReceipt';
import '../../demo-publishing.css';
export const dynamic='force-dynamic';
export default async function DemoConfirmationPage({params}){const {id}=await params;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))notFound();let receipt;try{receipt=await readDemoReceipt(id);}catch{throw new Error('This demo confirmation could not be loaded. Please try again shortly.');}if(!receipt)notFound();return <div className="demo-confirmation-page"><a className="demo-back-link" href={`/listing/${receipt.listingId}`}>Back to the demo listing</a><h1>Demo confirmation</h1><DemoReceipt receipt={receipt} coverImage={receipt.coverImage}/></div>;}
