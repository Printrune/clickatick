'use client';
import {useEffect,useState} from 'react';

function dateLabel(value){if(!value)return 'Date to be confirmed';const date=new Date(value);return Number.isNaN(date.getTime())?'Date to be confirmed':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(date);}

export default function PartnerEvents(){
  const [state,setState]=useState({status:'loading',events:[]});
  useEffect(()=>{let active=true;fetch('/api/partner-events').then(async response=>{if(!response.ok)throw new Error('unavailable');return response.json();}).then(data=>{if(active)setState({status:data.configured?'ready':'unconfigured',events:data.events||[]});}).catch(()=>{if(active)setState({status:'error',events:[]});});return()=>{active=false;};},[]);
  if(state.status==='unconfigured')return null;
  return <section className="marketplace-featured partner-events" aria-labelledby="partner-events-title"><div className="marketplace-featured-heading"><div><h2 id="partner-events-title">More events across the U.S.</h2><p>Discover events from Ticketmaster and its network. Ticket purchases take place with the ticket provider.</p></div></div>{state.status==='loading'?<p role="status">Finding more events…</p>:state.status==='error'?<p>Partner events are temporarily unavailable.</p>:state.events.length?<div className="marketplace-grid">{state.events.map(event=><a className="marketplace-event" href={event.url} target="_blank" rel="noopener noreferrer" key={event.id}><span className="marketplace-event-art" aria-hidden="true">{event.imageUrl?<img src={event.imageUrl} alt="" loading="lazy"/>:'✦'}</span><span className="marketplace-event-content"><small>Ticketmaster · External checkout</small><strong>{event.title}</strong><span>{[event.venue,event.city,event.state].filter(Boolean).join(' · ')}</span><span>{dateLabel(event.date)}</span><b>View tickets <span aria-hidden="true">↗</span></b>{event.imageAttribution&&<small className="partner-attribution">Image: {event.imageAttribution}</small>}</span></a>)}</div>:<p>No partner events are available right now.</p>}</section>;
}
