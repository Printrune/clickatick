import {PGlite} from '@electric-sql/pglite';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';

export const localOwner='11111111-1111-4111-8111-111111111111';
export function localMode(){return process.env.LOCAL_MODE==='true'&&!process.env.VERCEL;}
export function loopbackHost(host){
  try {return ['localhost','127.0.0.1','[::1]'].includes(new URL(`http://${host}`).hostname);}catch{return false;}
}
export function localRequest(request){return localMode()&&loopbackHost(request.headers.get('host')||'');}
const hash=token=>createHash('sha256').update(token).digest('hex');

export async function openLocalStore(directory){
 await mkdir(directory,{recursive:true});
 const db=new PGlite(directory);
 const exists=(await db.query("select to_regclass('public.local_sessions') as name")).rows[0].name;
 if(!exists){
  try{
   await db.exec('begin');
   await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
   await db.exec(await readFile(resolve(process.cwd(),'database/setup.sql'),'utf8'));
   await db.exec('create table public.local_sessions(token_hash text primary key,expires_at timestamptz not null);');
   await db.query('insert into auth.users(id) values($1::uuid)',[localOwner]);
   await db.exec('commit');
  }catch(error){await db.exec('rollback');await db.close();throw error;}
 }
 return {
  async createSession(){
   const token=randomBytes(32).toString('hex');
   await db.query('delete from local_sessions where expires_at<=now()');
   await db.query("insert into local_sessions values($1,now()+interval '8 hours')",[hash(token)]);
   return token;
  },
  async session(token){
   if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;
   const rows=(await db.query('select 1 from local_sessions where token_hash=$1 and expires_at>now()',[hash(token)])).rows;
   return rows.length?{token,user:{id:localOwner},local:true}:null;
  },
  async revoke(token){if(typeof token==='string')await db.query('delete from local_sessions where token_hash=$1',[hash(token)]);},
  async publish(id,draft,owner){await db.query('select public.publish_event_draft($1::uuid,$2::jsonb,$3::uuid)',[id,JSON.stringify(draft),owner]);},
  async listing(id){return (await db.query('select content from published_events where id=$1::uuid',[id])).rows;},
  close:()=>db.close()
 };
}
export function localStore(){
 if(!localMode())throw new Error('Local storage is disabled.');
 globalThis.__ticketnestLocalStore??=openLocalStore(resolve(process.cwd(),'.local-data')).catch(error=>{delete globalThis.__ticketnestLocalStore;throw error;});
 return globalThis.__ticketnestLocalStore;
}
