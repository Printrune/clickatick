import {createPhaseA1Service} from './integrated-phase-a1.mjs';

export async function clerkSubject(){
 const {auth}=await import('@clerk/nextjs/server');
 const session=await auth();
 return session.userId||null;
}

export function createNeonPhaseA1Store(query){
 const rows=async(text,params)=>await query(text,params);
 const prior=async(scope,key)=>(await rows('SELECT request_hash, response_json FROM request_idempotency WHERE scope=$1 AND key=$2::uuid',[scope,key]))[0]||null;
 return {
  async listBrands(userId){return await rows(`SELECT o.id,o.slug,o.name,m.role FROM organizer_members m JOIN organizers o ON o.id=m.organizer_id WHERE m.clerk_user_id=$1 AND m.status='active' AND o.status='active' ORDER BY lower(o.name),o.id`,[userId]);},
  async getBrand(userId,id){return (await rows(`SELECT o.id,o.slug,o.name,o.version,o.status AS organizer_status,m.role,m.status AS member_status FROM organizer_members m JOIN organizers o ON o.id=m.organizer_id WHERE m.clerk_user_id=$1 AND o.id=$2::uuid`,[userId,id]))[0]||null;},
  async createBrand({userId,name,slug,key,requestHash,id}){
   const scope=`brand-create:${userId}`;
   let existing=await prior(scope,key);
   if(existing)return existing.request_hash===requestHash?{kind:'replayed',brand:existing.response_json.brand}:{kind:'idempotency-conflict'};
   const rate=await rows(`INSERT INTO request_rate_limit(scope,minute_bucket,request_count) VALUES($1,date_trunc('minute',now()),1) ON CONFLICT(scope,minute_bucket) DO UPDATE SET request_count=request_rate_limit.request_count+1 WHERE request_rate_limit.request_count<10 RETURNING request_count`,[scope]);
   if(!rate.length)return {kind:'rate-limited'};
   const response={brand:{id,slug,name,role:'owner'},dashboardUrl:`/dashboard/${id}`};
   const created=await rows(`WITH claimed AS (
     INSERT INTO request_idempotency(scope,key,request_hash,response_json,status_code,expires_at)
     VALUES($1,$2::uuid,$3,$4::jsonb,201,now()+interval '24 hours')
     ON CONFLICT(scope,key) DO NOTHING RETURNING key
    ), brand AS (
     INSERT INTO organizers(id,slug,name) SELECT $5::uuid,$6,$7 FROM claimed RETURNING id,slug,name
    ), member AS (
     INSERT INTO organizer_members(organizer_id,clerk_user_id,role) SELECT id,$8,'owner' FROM brand RETURNING organizer_id
    ) SELECT brand.id,brand.slug,brand.name FROM brand JOIN member ON member.organizer_id=brand.id`,
    [scope,key,requestHash,JSON.stringify(response),id,slug,name,userId]);
   if(created.length)return {kind:'created',brand:created[0]};
   existing=await prior(scope,key);
   if(existing)return existing.request_hash===requestHash?{kind:'replayed',brand:existing.response_json.brand}:{kind:'idempotency-conflict'};
   throw new Error('Brand creation could not be reconciled.');
  }
 };
}

export async function neonPhaseA1Store(){
 const {neon}=await import('@neondatabase/serverless');
 const sql=neon(process.env.DATABASE_URL);
 return createNeonPhaseA1Store((text,params)=>sql.query(text,params));
}

export const phaseA1=createPhaseA1Service({subject:clerkSubject,store:neonPhaseA1Store});
