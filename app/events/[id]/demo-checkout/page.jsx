import {notFound} from 'next/navigation';
import DemoQuoteCheckout from '../../../../components/DemoQuoteCheckout';
import '../../public-event.css';
export const dynamic='force-dynamic';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function CheckoutPage({params,searchParams}){const {id}=await params;const {quote}=await searchParams;if(!UUID.test(id))notFound();return <DemoQuoteCheckout eventId={id} quoteId={typeof quote==='string'&&UUID.test(quote)?quote:null}/>;}
