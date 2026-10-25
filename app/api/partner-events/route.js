import {NextResponse} from 'next/server';
import {fetchTicketmasterEvents} from '../../../lib/ticketmaster-events.mjs';

export async function GET(request){
  try{
    const raw=new URL(request.url).searchParams.get('page')||'0';
    if(!/^\d{1,2}$/.test(raw)||Number(raw)>82)return NextResponse.json({error:'Invalid page'},{status:400});
    const result=await fetchTicketmasterEvents({page:Number(raw)});
    return NextResponse.json(result,{headers:{'Cache-Control':'public, s-maxage=900, stale-while-revalidate=1800'}});
  }catch{
    return NextResponse.json({configured:true,events:[],unavailable:true},{status:503,headers:{'Cache-Control':'public, s-maxage=60'}});
  }
}
