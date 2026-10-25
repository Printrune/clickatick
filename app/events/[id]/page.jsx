import {notFound} from 'next/navigation';
import {cache} from 'react';
import PublicEventExperience from '../../../components/PublicEventExperience';
import {publicDetail} from '../../../lib/integrated-phase-a4-runtime.mjs';
import {absolute,indexable} from '../../../lib/site';
import {ownEventSchema,safeJsonLd} from '../../../lib/event-seo.mjs';
import '../public-event.css';
export const dynamic='force-dynamic';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const seoEvent=cache(async id=>{if(!UUID.test(id))return null;try{return (await publicDetail(id)).event;}catch{return null;}});

export async function generateMetadata({params}){
 const {id}=await params,event=await seoEvent(id),eligible=event?.status==='published';
 const description=event?.description?.trim()||[event?.title,event?.location?.name,event?.location?.address].filter(Boolean).join(' · ')||'Find events and activities on Clickatick.';
 return {title:event?.title||'Event',description,alternates:{canonical:eligible&&indexable?absolute(`/events/${id}`):undefined},robots:{index:indexable&&eligible,follow:indexable},openGraph:eligible?{title:event.title,description,images:event.coverImageUrl?[absolute(event.coverImageUrl)]:[]}:undefined};
}

export default async function EventPage({params}){const {id}=await params;if(!UUID.test(id))notFound();const revisions=process.env.PUBLISHED_REVISIONS_ENABLED==='true',event=await seoEvent(id),schema=indexable?ownEventSchema(event,absolute(`/events/${id}`)):null;return <><PublicEventExperience eventId={id} promotionsEnabled={revisions&&process.env.PROMOTIONS_DEMO_ENABLED==='true'} referralsEnabled={revisions&&process.env.REFERRALS_DEMO_ENABLED==='true'}/>{schema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(schema)}}/>}</>;}
