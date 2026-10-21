import {createPhaseA2Service} from './integrated-phase-a2-service.mjs';
import {clerkSubject} from './integrated-phase-a1-runtime.mjs';

export function createNeonPhaseA2Store(query){
 const rows=(text,params)=>query(text,params);
 return {
  async membership(userId,organizerId){return (await rows(`SELECT o.status AS organizer_status,m.role,m.status AS member_status FROM organizer_members m JOIN organizers o ON o.id=m.organizer_id WHERE m.clerk_user_id=$1 AND o.id=$2::uuid`,[userId,organizerId]))[0]||null;},
  async list(organizerId,limit,cursor){return rows(`SELECT id,organizer_id,version,draft,source,created_at,updated_at FROM organizer_event_drafts WHERE organizer_id=$1::uuid AND ($2::timestamptz IS NULL OR (updated_at,id)<($2::timestamptz,$3::uuid)) ORDER BY updated_at DESC,id DESC LIMIT $4`,[organizerId,cursor?.updatedAt||null,cursor?.id||null,limit+1]);},
  async get(organizerId,eventId){return (await rows(`SELECT id,organizer_id,version,draft,source,created_at,updated_at FROM organizer_event_drafts WHERE organizer_id=$1::uuid AND id=$2::uuid`,[organizerId,eventId]))[0]||null;},
  async readyAssets(organizerId,ids){if(!ids.length)return [];return rows(`SELECT id FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=ANY($2::uuid[]) AND state='ready'`,[organizerId,ids]);},
  async create({organizerId,userId,id,key,hash,source,draft,response,createdAt}){
   const scope=`event-${source}:${userId}:${organizerId}`;
   const prior=await rows(`SELECT request_hash,response_json FROM request_idempotency WHERE scope=$1 AND key=$2::uuid`,[scope,key]);
   if(prior.length)return prior[0].request_hash===hash?{kind:'replayed',response:prior[0].response_json}:{kind:'conflict'};
   const result=await rows(`WITH member AS (
     SELECT 1 FROM organizer_members m JOIN organizers o ON o.id=m.organizer_id WHERE m.organizer_id=$1::uuid AND m.clerk_user_id=$2 AND m.role='owner' AND m.status='active' AND o.status='active'
    ), claim AS (
     INSERT INTO request_idempotency(scope,key,request_hash,response_json,status_code,expires_at)
     SELECT $3,$4::uuid,$5,$6::jsonb,201,now()+interval '24 hours' FROM member
     ON CONFLICT(scope,key) DO NOTHING RETURNING key
    ), event AS (
     INSERT INTO organizer_event_drafts(id,organizer_id,version,draft,source,created_by_clerk_user_id,updated_by_clerk_user_id,created_at,updated_at)
     SELECT $7::uuid,$1::uuid,1,$8::jsonb,$9,$2,$2,$10::timestamptz,$10::timestamptz FROM claim RETURNING id,organizer_id,version,draft,source,created_at,updated_at
    ) SELECT * FROM event`,[organizerId,userId,scope,key,hash,JSON.stringify(response),id,JSON.stringify(draft),source,createdAt]);
   if(result.length)return {kind:'created',row:result[0]};
   const replay=await rows(`SELECT request_hash,response_json FROM request_idempotency WHERE scope=$1 AND key=$2::uuid`,[scope,key]);
   if(replay.length)return replay[0].request_hash===hash?{kind:'replayed',response:replay[0].response_json}:{kind:'conflict'};
   return {kind:'denied'};
  },
  async patch({organizerId,eventId,userId,expectedVersion,draft}){const result=await rows(`UPDATE organizer_event_drafts e SET draft=$4::jsonb,version=version+1,updated_at=now(),updated_by_clerk_user_id=$3 WHERE e.organizer_id=$1::uuid AND e.id=$2::uuid AND e.version=$5 AND EXISTS(SELECT 1 FROM organizer_members m JOIN organizers o ON o.id=m.organizer_id WHERE m.organizer_id=$1::uuid AND m.clerk_user_id=$3 AND m.role='owner' AND m.status='active' AND o.status='active') RETURNING id,organizer_id,version,draft,source,created_at,updated_at`,[organizerId,eventId,userId,JSON.stringify(draft),expectedVersion]);return result[0]||null;},
 };
}
export async function neonPhaseA2Store(){const {neon}=await import('@neondatabase/serverless');const sql=neon(process.env.DATABASE_URL);return createNeonPhaseA2Store((text,params)=>sql.query(text,params));}
export const phaseA2=createPhaseA2Service({subject:clerkSubject,store:neonPhaseA2Store});
