import {parseBounds,nearbyTicketmaster,nearbyClickatick} from '../../../lib/event-map.mjs';

export async function GET(request){let bounds,page;try{const search=new URL(request.url).searchParams;bounds=parseBounds(search.get('bbox'));const raw=search.get('page')??'0';if(!/^[0-4]$/.test(raw))throw new RangeError('Invalid map page');page=Number(raw);}catch{return Response.json({error:'Zoom in to view events in this area.',code:'INVALID_BOUNDS'},{status:400});}
 const [partner,own]=await Promise.allSettled([nearbyTicketmaster(bounds,{page}),page===0?nearbyClickatick(bounds):Promise.resolve({events:[],unavailable:false})]);
 const ticketmaster=partner.status==='fulfilled'?partner.value:{events:[],nextPage:null,unavailable:true},clickatick=own.status==='fulfilled'?own.value:{events:[],unavailable:true};
 if(ticketmaster.unavailable&&clickatick.unavailable)return Response.json({error:'Events on the map are unavailable.',code:'MAP_UNAVAILABLE'},{status:503});
 return Response.json({events:[...clickatick.events,...ticketmaster.events],nextPage:ticketmaster.nextPage,coverage:'partial',unavailable:{ticketmaster:ticketmaster.unavailable,clickatick:clickatick.unavailable}}, {headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=900'}});
}
