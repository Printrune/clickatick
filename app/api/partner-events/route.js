import {NextResponse} from 'next/server';
import {fetchTicketmasterEvents} from '../../../lib/ticketmaster-events.mjs';

export async function GET(){
  try{
    const result=await fetchTicketmasterEvents();
    return NextResponse.json(result,{headers:{'Cache-Control':'public, s-maxage=900, stale-while-revalidate=1800'}});
  }catch{
    return NextResponse.json({configured:true,events:[],unavailable:true},{status:503,headers:{'Cache-Control':'public, s-maxage=60'}});
  }
}
