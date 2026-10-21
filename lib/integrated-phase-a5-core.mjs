import {createHash} from 'node:crypto';
import {PhaseA1Error} from './integrated-phase-a1.mjs';
import {eventSummary,encodeCursor,decodeCursor} from './integrated-phase-a4.mjs';

const fail=(code,message,status,extra)=>{const error=new PhaseA1Error(code,message,status);Object.assign(error,extra);throw error;};
const hash=value=>createHash('sha256').update(value).digest('hex');

export async function acceptInviteTx(q,{raw,user,idempotencyKey}){
 const row=(await q('SELECT i.*,o.name,o.status AS brand_status FROM organizer_invitations i JOIN organizers o ON o.id=i.organizer_id WHERE i.token_hash=$1 FOR UPDATE',[hash(raw)]))[0];
 if(!row)fail('INVITATION_UNAVAILABLE','This invitation is unavailable.',410);
 const scope=`invite-accept:${row.id}:${user}`;
 const prior=(await q('SELECT response_json FROM request_idempotency WHERE scope=$1 AND key=$2::uuid',[scope,idempotencyKey]))[0];
 if(prior)return prior.response_json;
 if(row.status==='accepted'){
  if(row.accepted_by_clerk_user_id===user)fail('INVITATION_ALREADY_ACCEPTED','You already joined this brand.',409,{dashboardUrl:`/dashboard/${row.organizer_id}`});
  fail('INVITATION_ALREADY_USED','This invitation has been used.',409);
 }
 if(row.status!=='created'||new Date(row.expires_at)<=new Date()||row.brand_status!=='active')fail('INVITATION_UNAVAILABLE','This invitation is unavailable.',410);
 const existing=(await q('SELECT id FROM organizer_members WHERE organizer_id=$1::uuid AND clerk_user_id=$2',[row.organizer_id,user]))[0];
 if(existing)fail('MEMBERSHIP_EXISTS','You already belong to this brand.',409);
 await q('INSERT INTO organizer_members(organizer_id,clerk_user_id,role) VALUES($1::uuid,$2,$3)',[row.organizer_id,user,row.role]);
 await q("UPDATE organizer_invitations SET status='accepted',accepted_by_clerk_user_id=$2,accepted_at=now(),version=version+1 WHERE id=$1::uuid",[row.id,user]);
 const data={brand:{id:row.organizer_id,name:row.name},membership:{role:row.role,status:'active'},dashboardUrl:`/dashboard/${row.organizer_id}`};
 await q("INSERT INTO request_idempotency(scope,key,request_hash,response_json,status_code,expires_at) VALUES($1,$2::uuid,$3,$4::jsonb,200,now()+interval '24 hours')",[scope,idempotencyKey,hash(row.id),JSON.stringify(data)]);
 await q("INSERT INTO organizer_team_audit(organizer_id,actor_clerk_user_id,action,invitation_id) VALUES($1::uuid,$2,'invite-accepted',$3::uuid)",[row.organizer_id,user,row.id]);
 return data;
}

export async function storefrontEventsWithDb(org,params,query){
 const raw=params.get('limit'),limit=raw===null?12:Number(raw);
 if(!Number.isInteger(limit)||limit<1||limit>24)fail('INVALID_INPUT','Check the page size.',400);
 const scope=`storefront:${org}`,cursor=decodeCursor(params.get('cursor'),scope);
 const rows=await query(`SELECT e.*,o.name AS organizer_name,(SELECT min(x.starts_at_utc) FROM public_occurrences x WHERE x.event_id=e.id AND x.starts_at_utc>now()) AS next_at FROM public_events e JOIN organizers o ON o.id=e.organizer_id WHERE e.organizer_id=$1::uuid AND e.status='published' AND o.status='active' AND ($2::boolean=false OR (coalesce((SELECT min(x.starts_at_utc) FROM public_occurrences x WHERE x.event_id=e.id AND x.starts_at_utc>now()),'infinity'::timestamptz),e.id)>($3::timestamptz,$4::uuid)) ORDER BY next_at ASC NULLS LAST,e.id ASC LIMIT $5`,[org,Boolean(cursor),cursor?.[0]||null,cursor?.[1]||null,limit+1]);
 const selected=rows.slice(0,limit),events=await Promise.all(selected.map(async event=>{
  const [occurrences,tiers]=await Promise.all([query('SELECT * FROM public_occurrences WHERE event_id=$1::uuid ORDER BY starts_at_utc,id',[event.id]),query('SELECT * FROM public_tiers WHERE event_id=$1::uuid ORDER BY position,id',[event.id])]);
  return eventSummary(event,occurrences,tiers);
 }));
 const last=selected.at(-1);
 return {events,nextCursor:rows.length>limit?encodeCursor({scope,position:[last.next_at?new Date(last.next_at).toISOString():'infinity',last.id]}):null};
}
