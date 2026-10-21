import {randomUUID} from 'node:crypto';
import {expandOccurrences} from './integrated-phase-a4-write.mjs';

// Called inside the event publication/approval transaction, after the version row.
// Approved rows are append-only; the caller switches active_version only after this completes.
export async function insertVersionChildren(tx,{eventId,organizerId,version,draft,oldVersion=null,initial=null,now=Date.now()}){
 const occurrences=initial?.occurrences??expandOccurrences(draft,now),previous=oldVersion?await tx.many('SELECT id,start_local,starts_at_utc,time_zone FROM public_version_occurrences WHERE event_id=$1::uuid AND event_version=$2',[eventId,oldVersion]):[];
 const occurrenceKey=(local,utc,zone)=>`${local}:${new Date(utc).toISOString()}:${zone}`;
 const occurrenceIds=new Map(previous.map(x=>[occurrenceKey(x.start_local,x.starts_at_utc,x.time_zone),x.id]));
 for(const occurrence of occurrences){occurrence.id=occurrenceIds.get(occurrenceKey(occurrence.startLocal,occurrence.startsAtUtc,occurrence.timeZone))||occurrence.id;await tx.exec(`INSERT INTO public_version_occurrences(event_id,event_version,id,start_local,starts_at_utc,ends_at_utc,time_zone,duration_minutes) VALUES($1::uuid,$2,$3::uuid,$4,$5::timestamptz,$6::timestamptz,$7,$8)`,[eventId,version,occurrence.id,occurrence.startLocal,occurrence.startsAtUtc,occurrence.endsAtUtc,occurrence.timeZone,occurrence.durationMinutes]);}
 for(let position=0;position<draft.tiers.length;position++){const tier=draft.tiers[position];await tx.exec(`INSERT INTO public_version_tiers(event_id,event_version,id,position,name,description,price_minor,allocation,seat_policy) VALUES($1::uuid,$2,$3::uuid,$4,$5,$6,$7,$8,$9)`,[eventId,version,tier.id,position,tier.name,tier.description,tier.priceMinor,tier.allocation,tier.seatPolicy]);}
 const priorSeats=oldVersion?await tx.many('SELECT id,section_id,row_number,seat_number FROM public_version_seats WHERE event_id=$1::uuid AND event_version=$2',[eventId,oldVersion]):initial?.seats?.map(s=>({id:s.id,section_id:s.sectionId,row_number:s.row,seat_number:s.number}))??[];
 const preserved=new Map(priorSeats.map(s=>[`${s.section_id}:${s.row_number}:${s.seat_number}`,s.id]));
 for(let position=0;position<draft.seating.sections.length;position++){
  const section=draft.seating.sections[position];await tx.exec(`INSERT INTO public_version_sections(event_id,event_version,id,position,name,rows,seats_per_row,seat_tier_id) VALUES($1::uuid,$2,$3::uuid,$4,$5,$6,$7,$8::uuid)`,[eventId,version,section.id,position,section.name,section.rows,section.seatsPerRow,section.seatTierId]);
  const removed=new Set(section.removedSeats.map(x=>`${x.row}:${x.number}`)),accessible=new Set(section.accessibleSeats.map(x=>`${x.row}:${x.number}`)),overrides=new Map(section.seatOverrides.map(x=>[`${x.row}:${x.number}`,x.seatTierId]));
  for(let row=1;row<=section.rows;row++)for(let number=1;number<=section.seatsPerRow;number++){const key=`${row}:${number}`;if(removed.has(key))continue;const identity=`${section.id}:${key}`,id=(initial||!section.geometryReset)&&preserved.has(identity)?preserved.get(identity):randomUUID();await tx.exec(`INSERT INTO public_version_seats(event_id,event_version,id,section_id,row_number,seat_number,accessible,seat_tier_id,tier_override) VALUES($1::uuid,$2,$3::uuid,$4::uuid,$5,$6,$7,$8::uuid,$9)`,[eventId,version,id,section.id,row,number,accessible.has(key),overrides.has(key)?overrides.get(key):section.seatTierId,overrides.has(key)]);}
 }
 for(const occurrenceId of draft.inventory.dateScope==='per_occurrence'?occurrences.map(x=>x.id):[null]){
  const totalPool=initial?.pools?.find(p=>p.occurrenceId===occurrenceId&&p.tierId===null);await tx.exec(`INSERT INTO public_version_inventory_pools(event_id,event_version,id,occurrence_id,tier_id,configured_capacity) VALUES($1::uuid,$2,$3::uuid,$4::uuid,NULL::uuid,$5)`,[eventId,version,totalPool?.id??randomUUID(),occurrenceId,draft.inventory.totalCapacity]);
  if(draft.inventory.tierScope==='allocated')for(const tier of draft.tiers){const pool=initial?.pools?.find(p=>p.occurrenceId===occurrenceId&&p.tierId===tier.id);await tx.exec(`INSERT INTO public_version_inventory_pools(event_id,event_version,id,occurrence_id,tier_id,configured_capacity) VALUES($1::uuid,$2,$3::uuid,$4::uuid,$5::uuid,$6)`,[eventId,version,pool?.id??randomUUID(),occurrenceId,tier.id,tier.allocation]);}
 }
 for(const [slot,assetId] of [['business',draft.businessLocation.photoAssetId],['event-location',draft.eventLocation?.photoAssetId],['cover',draft.coverAssetId]])if(assetId)await tx.exec(`INSERT INTO public_version_media_refs(event_id,event_version,organizer_id,slot,asset_id) VALUES($1::uuid,$2,$3::uuid,$4,$5::uuid)`,[eventId,version,organizerId,slot,assetId]);
 return {occurrences};
}
