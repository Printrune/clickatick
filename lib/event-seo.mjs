export function safeJsonLd(value){return JSON.stringify(value).replace(/</g,'\\u003c');}

export function partnerEventSchema(event,pageUrl){
  if(!event?.localDate||!event.venue||!event.address||event.status==='cancelled')return null;
  const location={'@type':'Place',name:event.venue,address:{'@type':'PostalAddress',streetAddress:event.streetAddress||undefined,addressLocality:event.city||undefined,addressRegion:event.state||undefined,postalCode:event.postalCode||undefined,addressCountry:event.country||'US'}};
  return {'@context':'https://schema.org','@type':'Event','@id':pageUrl,name:event.title,url:pageUrl,startDate:event.localTime?`${event.localDate}T${event.localTime}`:event.localDate,location,image:event.imageUrl?[event.imageUrl]:undefined,description:event.info||event.pleaseNote||undefined};
}

export function ownEventSchema(event,pageUrl){
  if(!event||event.status!=='published'||!event.nextOccurrence?.startsAtUtc||!event.location?.address)return null;
  const occurrence=event.occurrences?.find(item=>item.id===event.nextOccurrence.id);
  const hasPoint=event.location.latitude!=null&&event.location.longitude!=null&&Number.isFinite(Number(event.location.latitude))&&Number.isFinite(Number(event.location.longitude));
  return {'@context':'https://schema.org','@type':'Event','@id':pageUrl,name:event.title,url:pageUrl,startDate:event.nextOccurrence.startsAtUtc,endDate:occurrence?.endsAtUtc,description:event.description||undefined,image:event.coverImageUrl?[new URL(event.coverImageUrl,pageUrl).toString()]:undefined,location:{'@type':'Place',name:event.location.name||undefined,address:{'@type':'PostalAddress',name:event.location.address},geo:hasPoint?{'@type':'GeoCoordinates',latitude:Number(event.location.latitude),longitude:Number(event.location.longitude)}:undefined}};
}
