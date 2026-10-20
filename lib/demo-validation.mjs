import {listingRequiredErrors} from './listing.mjs';
import {eventPublicationErrors} from './event-system.mjs';
export const MAX_DEMO_TICKETS=20;
export const MAX_DEMO_ITEMS=10;
export function demoPublicationErrors(draft){
 const errors=listingRequiredErrors(draft);
 if(draft.setup.disclaimer&&!draft.setup.disclaimerReviewed)errors.push('Review the organiser disclaimer before publishing.');
 if(errors.length)return errors;
 return eventPublicationErrors(draft);
}
export function demoOccurrences(draft){
 const schedule=draft.schedule;
 if(schedule.kind==='dates')return [...schedule.dates];
 if(!schedule.start||!schedule.until||!schedule.time||!schedule.weekdays.length)return [];
 const first=Date.parse(`${schedule.start}T12:00:00Z`),last=Date.parse(`${schedule.until}T12:00:00Z`);
 if(!Number.isFinite(first)||!Number.isFinite(last)||last<first||last-first>365*86400000)return [];
 const dates=[];
 for(let day=first;day<=last;day+=86400000){const value=new Date(day);if(schedule.weekdays.includes(value.getUTCDay()))dates.push(`${value.toISOString().slice(0,10)}T${schedule.time}`);}
 return dates;
}
export function demoTicketTypes(draft){
 const capacity=value=>/^\d+$/.test(value)&&Number(value)>0?Number(value):null;
 if(!draft.ticketTiers.length)return [{id:'general',name:'General admission',priceCents:Math.round(Number(draft.price)*100),capacity:capacity(draft.capacity)}];
 return draft.ticketTiers.map(tier=>({id:tier.id,name:tier.name,priceCents:Math.round(Number(tier.price)*100),capacity:capacity(draft.setup.inventoryMode==='shared'?draft.capacity:tier.quantity)}));
}
