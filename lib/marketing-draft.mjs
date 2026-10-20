import {scheduleLabel} from './listing.mjs';
import {effectiveLocation} from './setup.mjs';
export const DEMO_MARKETING_NOTICE='Demo only. No real ticket or payment is created.';
export function listingFacts(listing){
 const event=listing.draft,prices=event.ticketTiers.length?event.ticketTiers.map(t=>Number(t.price)):[Number(event.price)],min=Math.min(...prices),max=Math.max(...prices),priceLabel=max===0?'Free demo tickets':`${min!==max?'From ':''}$${min.toFixed(2)} USD`;
 const schedule=event.schedule.kind==='dates'&&event.schedule.dates.length>1?`${event.schedule.dates[0].replace('T',' at ')} and ${event.schedule.dates.length-1} additional dates. Full schedule on the listing.`:scheduleLabel(event);
 return {title:event.title,dateLabel:`${schedule} (${event.timezone})`,timezone:event.timezone,location:event.location,priceLabel,restrictions:event.setup.restrictions,photo:effectiveLocation(event.setup).photo||null};
}
export function createMarketingDraft(listing,kind='social',direction='introduction'){
 const facts=listingFacts(listing),base=[`Demo event: ${facts.title}`,facts.dateLabel,facts.location,facts.priceLabel,facts.restrictions,`Try the demo booking: /listing/${listing.id}`,DEMO_MARKETING_NOTICE].filter(Boolean).join('\n\n');
 let caption=base,placement='Social post';
 if(kind==='poster')placement='Event poster';
 if(kind==='video'&&direction==='visit'){placement='Storyboard: Plan your visit';caption=`Storyboard only. Video rendering is not connected.

Scene 1, 3 seconds: Event location on a practical visit card.
Scene 2, 5 seconds: Event title, dates and timezone.
Scene 3, 5 seconds: Ticket prices and restrictions.
Scene 4, 4 seconds: Demo booking link.
Audio: None selected.

${base}`;}
 if(kind==='video'&&direction!=='visit'){placement='Storyboard: Event introduction';caption=`Storyboard only. Video rendering is not connected.\n\nScene 1, 3 seconds: Event title over the supplied photo or a text card.\nScene 2, 5 seconds: Dates and location.\nScene 3, 5 seconds: Ticket prices and restrictions.\nScene 4, 4 seconds: Demo booking link.\nAudio: None selected.\n\n${base}`;}
 if(kind==='ad-plan'){placement='Draft ad plan';caption=`Draft ad plan. No campaign is connected.\n\nFacts\n${base}\n\nHypothesis\nCompare an event-photo introduction with practical visit details. Test listing-link clicks. This is untested; no results are available.\n\nMissing information\nAudience: MISSING\nAdvertising platform: MISSING\nBudget: MISSING\nTracking and permission: MISSING\nLive booking and approved launch: MISSING\n\nNo advertising spend is authorized by this draft.`;}
 return {kind,title:facts.title,caption,altText:facts.photo?'Event photo supplied by the organizer.':`${facts.title}. Demonstration event.`,placement};
}
export function videoDirections(){return [{id:'introduction',title:'Event introduction',description:'Introduce the event, then show dates, location, prices and the demo link.'},{id:'visit',title:'Plan your visit',description:'Start with the location, then show the event, dates, ticket details and demo link.'}];}
