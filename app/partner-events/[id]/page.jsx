import Link from 'next/link';
import {notFound} from 'next/navigation';
import {fetchTicketmasterEvent} from '../../../lib/ticketmaster-events.mjs';
import './partner-event.css';

function dateLabel(event){
  if(!event.localDate)return 'Date to be confirmed';
  const date=new Date(`${event.localDate}T12:00:00Z`);
  if(Number.isNaN(date.getTime()))return 'Date to be confirmed';
  const day=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(date);
  if(!event.localTime)return day;
  const time=new Date(`2000-01-01T${event.localTime}Z`);
  return Number.isNaN(time.getTime())?day:`${day} · ${new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:'UTC'}).format(time)} local time`;
}

async function readEvent(id){try{return {event:await fetchTicketmasterEvent(id),unavailable:false};}catch{return {event:null,unavailable:true};}}

export async function generateMetadata({params}){
  const {id}=await params;
  const {event}=await readEvent(id);
  return {title:event?`${event.title} tickets`:'Partner event',description:event?`Explore ${event.title} on Clickatick. Buy tickets with the ticket provider.`:'Explore partner events on Clickatick.'};
}

export default async function PartnerEventPage({params}){
  const {id}=await params;
  const {event,unavailable}=await readEvent(id);
  if(!event&&!unavailable)notFound();
  if(unavailable)return <div className="partner-detail"><Link href="/">← Back to events</Link><section className="partner-detail-unavailable"><h1>Event details are temporarily unavailable.</h1><p>Please try again in a moment.</p><Link href={`/partner-events/${encodeURIComponent(id)}`}>Retry</Link></section></div>;
  const seller=new URL(event.url).hostname.replace(/^www\./,'');
  return <div className="partner-detail"><Link className="partner-detail-back" href="/">← Back to events</Link><article><header className="partner-detail-hero"><div className="partner-detail-copy"><p className="partner-detail-source">Ticketmaster network event</p><h1>{event.title}</h1><p className="partner-detail-lead">{dateLabel(event)}</p><p>{[event.venue,event.address].filter(Boolean).join(' · ')||'Venue details on the ticket provider’s site'}</p>{event.category&&<p className="partner-detail-category">{event.category}</p>}<a className="partner-detail-buy" href={event.url} target="_blank" rel="noopener noreferrer">Buy tickets with the provider <span aria-hidden="true">↗</span></a><small>Opens {seller} in a new tab. Final availability, prices, fees and payment are handled there.</small></div><figure className="partner-detail-art">{event.imageUrl?<img src={event.imageUrl} alt=""/>:<div className="partner-detail-fallback" aria-hidden="true">✦</div>}{event.imageAttribution&&<figcaption>Image: {event.imageAttribution}</figcaption>}</figure></header>{(event.info||event.pleaseNote)&&<section className="partner-detail-info"><h2>About this event</h2>{event.info&&<p>{event.info}</p>}{event.pleaseNote&&<p>{event.pleaseNote}</p>}</section>}<aside className="partner-detail-provider"><h2>Tickets are sold by the provider</h2><p>Clickatick helps you discover this event. Your purchase happens on {seller}; Clickatick’s 10% organizer fee does not apply to these tickets.</p></aside></article></div>;
}
