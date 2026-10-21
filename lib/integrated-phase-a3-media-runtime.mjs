import {createPrivateMediaService} from './integrated-phase-a3-media.mjs';
import {clerkSubject} from './integrated-phase-a1-runtime.mjs';
import {liveMediaStoreOptions} from './private-blob-credentials.mjs';

export function createNeonPhaseA3Store(query){
 const rows=(text,params)=>query(text,params);
 const assetSelect=`SELECT a.*,coalesce(r.reference_count,0)::int AS reference_count FROM organizer_media_assets a LEFT JOIN LATERAL (SELECT count(*) AS reference_count FROM organizer_event_asset_refs ref WHERE ref.organizer_id=a.organizer_id AND ref.asset_id=a.id) r ON true`;
 return {
  async membership(userId,org){return (await rows(`SELECT o.status AS organizer_status,m.role,m.status AS member_status FROM organizer_members m JOIN organizers o ON o.id=m.organizer_id WHERE m.clerk_user_id=$1 AND o.id=$2::uuid`,[userId,org]))[0]||null;},
  async get(org,id){return (await rows(`${assetSelect} WHERE a.organizer_id=$1::uuid AND a.id=$2::uuid`,[org,id]))[0]||null;},
  async list(org,limit,cursor){return rows(`${assetSelect} WHERE a.organizer_id=$1::uuid AND a.state IN ('ready','deleting') AND ($2::timestamptz IS NULL OR (a.created_at,a.id)<($2::timestamptz,$3::uuid)) ORDER BY a.created_at DESC,a.id DESC LIMIT $4`,[org,cursor?.createdAt||null,cursor?.id||null,limit+1]);},
  async references(org,id,limit,cursor){return rows(`SELECT ref.event_id,ref.slot,e.draft->>'title' AS title FROM organizer_event_asset_refs ref JOIN organizer_event_drafts e ON e.id=ref.event_id AND e.organizer_id=ref.organizer_id WHERE ref.organizer_id=$1::uuid AND ref.asset_id=$2::uuid AND ($3::uuid IS NULL OR (ref.event_id,ref.slot)>($3::uuid,$4)) ORDER BY ref.event_id,ref.slot LIMIT $5`,[org,id,cursor?.eventId||null,cursor?.slot||null,limit+1]);},
  async reserve({org,userId,assetId,path,uploadId,hash,kind,altText}){
   const prior=(await rows(`SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND upload_subject=$2 AND upload_id=$3::uuid`,[org,userId,uploadId]))[0];
   if(prior)return prior.request_hash!==hash?{kind:'different'}:prior.state==='ready'?{kind:'replay',row:{...prior,reference_count:0}}:['pending','reconciling'].includes(prior.state)?{kind:prior.state,row:prior}:{kind:'failed'};
   const created=await rows(`WITH brand AS (SELECT id FROM organizers WHERE id=$1::uuid AND status='active' FOR UPDATE), usage AS (
     SELECT count(*) FILTER (WHERE state IN ('pending','reconciling','ready','deleting'))::int AS assets,
       coalesce(sum(CASE WHEN state IN ('pending','reconciling') THEN 2097152 WHEN state IN ('ready','deleting') THEN byte_length ELSE 0 END),0)::bigint AS bytes,
       count(*) FILTER (WHERE state IN ('pending','reconciling'))::int AS pending,
       count(*) FILTER (WHERE created_at>now()-interval '1 hour')::int AS hourly
     FROM brand CROSS JOIN LATERAL (SELECT * FROM organizer_media_assets WHERE organizer_id=brand.id) assets
    ), claim AS (
     INSERT INTO organizer_media_assets(id,organizer_id,private_blob_path,mime,byte_length,width,height,alt_text,state,created_by_clerk_user_id,kind,version,upload_id,upload_subject,request_hash,reservation_expires_at)
     SELECT $2::uuid,$1::uuid,$3,'image/webp',NULL,NULL,NULL,$7,'pending',$4,$8,1,$5::uuid,$4,$6,now()+interval '10 minutes'
     FROM brand,usage WHERE usage.assets<100 AND usage.bytes+2097152<=104857600 AND usage.pending<2 AND usage.hourly<10
     ON CONFLICT DO NOTHING RETURNING *
    ) SELECT * FROM claim`,[org,assetId,path,userId,uploadId,hash,altText,kind]);
   if(created.length)return {kind:'reserved',row:created[0]};
   const raced=(await rows(`SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND upload_subject=$2 AND upload_id=$3::uuid`,[org,userId,uploadId]))[0];
   if(raced)return raced.request_hash!==hash?{kind:'different'}:raced.state==='ready'?{kind:'replay',row:{...raced,reference_count:0}}:['pending','reconciling'].includes(raced.state)?{kind:raced.state,row:raced}:{kind:'failed'};
   const usage=(await rows(`SELECT count(*) FILTER (WHERE state IN ('pending','reconciling','ready','deleting'))::int AS assets,coalesce(sum(CASE WHEN state IN ('pending','reconciling') THEN 2097152 WHEN state IN ('ready','deleting') THEN byte_length ELSE 0 END),0)::bigint AS bytes,count(*) FILTER (WHERE state IN ('pending','reconciling'))::int AS pending,count(*) FILTER (WHERE created_at>now()-interval '1 hour')::int AS hourly FROM organizer_media_assets WHERE organizer_id=$1::uuid`,[org]))[0];
   return usage.assets>=100||Number(usage.bytes)+2097152>104857600?{kind:'quota'}:{kind:'rate'};
  },
  async finalize({org,assetId,mime,byteLength,width,height}){return (await rows(`UPDATE organizer_media_assets SET state='ready',mime=$3,byte_length=$4,width=$5,height=$6,reservation_expires_at=NULL WHERE organizer_id=$1::uuid AND id=$2::uuid AND state='pending' RETURNING *,0::int AS reference_count`,[org,assetId,mime,byteLength,width,height]))[0]||null;},
  async claimExpiredPending(org,id){return (await rows(`UPDATE organizer_media_assets SET state='reconciling' WHERE organizer_id=$1::uuid AND id=$2::uuid AND state='pending' AND reservation_expires_at<=now() RETURNING id`,[org,id])).length>0;},
  async failPending(org,id){await rows(`UPDATE organizer_media_assets SET state='failed',reservation_expires_at=NULL WHERE organizer_id=$1::uuid AND id=$2::uuid AND state IN ('pending','reconciling')`,[org,id]);},
  async beginDelete(org,id,version){const result=(await rows('SELECT begin_organizer_asset_delete($1::uuid,$2::uuid,$3::integer) AS result',[org,id,version]))[0]?.result;return result||{kind:'missing'};},
  async completeDelete(org,id){await rows(`UPDATE organizer_media_assets SET state='deleted',version=version+1 WHERE organizer_id=$1::uuid AND id=$2::uuid AND state='deleting'`,[org,id]);}
 };
}
export async function neonPhaseA3Store(){const {neon}=await import('@neondatabase/serverless');const sql=neon(process.env.DATABASE_URL);return createNeonPhaseA3Store((text,params)=>sql.query(text,params));}
export function privateBlobAdapter(){return {async put(path,bytes,{contentType}){const {put}=await import('@vercel/blob');return put(path,bytes,{access:'private',contentType,addRandomSuffix:false,allowOverwrite:false,...liveMediaStoreOptions()});},async get(path){const {get}=await import('@vercel/blob');return get(path,{access:'private',useCache:false,...liveMediaStoreOptions()});},async del(path){const {del}=await import('@vercel/blob');return del(path,liveMediaStoreOptions());}};}

// Quotas are proposed, not approved. Production writes cannot be enabled by env alone.
export const phaseA3=createPrivateMediaService({subject:clerkSubject,store:neonPhaseA3Store,blob:privateBlobAdapter,enabled:false});
