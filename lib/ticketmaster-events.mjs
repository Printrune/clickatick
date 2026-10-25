const EVENT_ENDPOINT='https://app.ticketmaster.com/discovery/v2/events.json';

export function normalizeTicketmasterEvent(event){
  if(!event || typeof event.id!=='string' || typeof event.name!=='string')return null;
  let url;
  try{url=new URL(event.url);if(url.protocol!=='https:')return null;}catch{return null;}
  const venue=event._embedded?.venues?.[0];
  const image=(event.images||[]).filter(item=>item?.url?.startsWith('https://')).sort((a,b)=>(b.width||0)-(a.width||0))[0];
  return {id:event.id,title:event.name,url:url.toString(),imageUrl:image?.url||null,imageAttribution:image?.attribution||null,date:event.dates?.start?.dateTime||event.dates?.start?.localDate||null,venue:venue?.name||null,city:venue?.city?.name||null,state:venue?.state?.stateCode||null,source:'Ticketmaster'};
}

export async function fetchTicketmasterEvents({key=process.env.TICKETMASTER_API_KEY,fetchImpl=fetch}={}){
  if(!key)return {events:[],configured:false};
  const url=new URL(EVENT_ENDPOINT);
  url.searchParams.set('apikey',key);
  url.searchParams.set('countryCode','US');
  url.searchParams.set('size','12');
  url.searchParams.set('sort','date,asc');
  url.searchParams.set('startDateTime',new Date().toISOString().replace(/\.\d{3}Z$/,'Z'));
  const response=await fetchImpl(url,{next:{revalidate:900},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error(`Ticketmaster returned ${response.status}`);
  const body=await response.json();
  return {configured:true,events:(body._embedded?.events||[]).map(normalizeTicketmasterEvent).filter(Boolean)};
}
