const EVENT_ENDPOINT='https://app.ticketmaster.com/discovery/v2/events.json';
const PAGE_SIZE=12;
const LAST_PAGE=82; // Ticketmaster limits deep paging to the first 1,000 results.

export function normalizeTicketmasterEvent(event){
  if(!event || typeof event.id!=='string' || typeof event.name!=='string')return null;
  let url;
  try{
    url=new URL(event.url);
    if(url.protocol!=='https:')return null;
    if(url.hostname==='ticketmaster.evyy.net'){
      url=new URL(url.searchParams.get('u'));
      if(url.protocol!=='https:'||!(/(^|\.)ticketmaster\.com$/i).test(url.hostname))return null;
    }
  }catch{return null;}
  const venue=event._embedded?.venues?.[0];
  const image=(event.images||[]).filter(item=>item?.url?.startsWith('https://')).sort((a,b)=>(b.width||0)-(a.width||0))[0];
  return {id:event.id,title:event.name,url:url.toString(),imageUrl:image?.url||null,imageAttribution:image?.attribution||null,date:event.dates?.start?.dateTime||event.dates?.start?.localDate||null,venue:venue?.name||null,city:venue?.city?.name||null,state:venue?.state?.stateCode||null,source:'Ticketmaster'};
}

export function normalizeTicketmasterDetail(event){
  const base=normalizeTicketmasterEvent(event);
  if(!base)return null;
  const venue=event._embedded?.venues?.[0];
  const parts=[venue?.address?.line1,venue?.city?.name,venue?.state?.stateCode,venue?.postalCode].filter(Boolean);
  return {...base,localDate:event.dates?.start?.localDate||null,localTime:event.dates?.start?.localTime||null,address:parts.join(', '),streetAddress:venue?.address?.line1||null,postalCode:venue?.postalCode||null,country:venue?.country?.countryCode||null,category:event.classifications?.find(item=>item.primary)?.segment?.name||null,info:typeof event.info==='string'?event.info:null,pleaseNote:typeof event.pleaseNote==='string'?event.pleaseNote:null,status:event.dates?.status?.code||null};
}

export async function fetchTicketmasterEvent(id,{key=process.env.TICKETMASTER_API_KEY,fetchImpl=fetch}={}){
  if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(id))return null;
  if(!key)throw new Error('Ticketmaster is not configured');
  const url=new URL(`https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(id)}.json`);
  url.searchParams.set('apikey',key);
  const response=await fetchImpl(url,{next:{revalidate:900},signal:AbortSignal.timeout(8000)});
  if(response.status===404)return null;
  if(!response.ok)throw new Error(`Ticketmaster returned ${response.status}`);
  return normalizeTicketmasterDetail(await response.json());
}

export async function fetchTicketmasterEvents({key=process.env.TICKETMASTER_API_KEY,fetchImpl=fetch,page=0}={}){
  if(!Number.isInteger(page)||page<0||page>LAST_PAGE)throw new RangeError('Invalid partner event page');
  if(!key)return {events:[],configured:false,nextPage:null};
  const url=new URL(EVENT_ENDPOINT);
  url.searchParams.set('apikey',key);
  url.searchParams.set('countryCode','US');
  url.searchParams.set('size',String(PAGE_SIZE));
  url.searchParams.set('page',String(page));
  url.searchParams.set('sort','date,asc');
  url.searchParams.set('startDateTime',new Date().toISOString().slice(0,13)+':00:00Z');
  const response=await fetchImpl(url,{next:{revalidate:900},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error(`Ticketmaster returned ${response.status}`);
  const body=await response.json();
  const events=(body._embedded?.events||[]).map(normalizeTicketmasterEvent).filter(Boolean);
  const totalPages=Number(body.page?.totalPages);
  const nextPage=events.length&&page<LAST_PAGE&&(!Number.isFinite(totalPages)||page+1<totalPages)?page+1:null;
  return {configured:true,events,nextPage};
}
