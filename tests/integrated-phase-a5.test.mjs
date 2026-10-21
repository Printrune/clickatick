import test from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import {storefront,storefrontEvents,ownerStorefront,team,createInvitation,previewInvitation,acceptInvitation,emailUnavailable} from '../lib/integrated-phase-a5.mjs';
import {errorResponse} from '../lib/integrated-phase-a1.mjs';
const ID='80b2fcb1-6428-40b0-81e5-d92982c43f11';
test('A5 feature gates fail closed before any private/public data access',async()=>{
 const previous={STOREFRONT_ENABLED:process.env.STOREFRONT_ENABLED,STAFF_INVITES_ENABLED:process.env.STAFF_INVITES_ENABLED};
 delete process.env.STOREFRONT_ENABLED;delete process.env.STAFF_INVITES_ENABLED;
 try{for(const work of [()=>storefront(ID),()=>storefrontEvents(ID,new URLSearchParams()),()=>ownerStorefront(ID),()=>team(ID,new URLSearchParams()),()=>previewInvitation('a'.repeat(43)),()=>emailUnavailable()])await assert.rejects(work,e=>e.code==='FEATURE_UNAVAILABLE'&&e.status===503);}finally{for(const [k,v] of Object.entries(previous))v===undefined?delete process.env[k]:process.env[k]=v;}
});
test('A5 requires connected database and never invents empty storefront',async()=>{
 const prev={STOREFRONT_ENABLED:process.env.STOREFRONT_ENABLED,DATABASE_URL:process.env.DATABASE_URL};
 process.env.STOREFRONT_ENABLED='true';delete process.env.DATABASE_URL;
 try{await assert.rejects(()=>storefront(ID),e=>e.code==='DATABASE_UNAVAILABLE'&&e.status===503);}finally{for(const [k,v] of Object.entries(prev))v===undefined?delete process.env[k]:process.env[k]=v;}
});
test('A5 conflict envelope includes paired versions and recovery URL',async()=>{
 const {PhaseA1Error}=await import('../lib/integrated-phase-a1.mjs');
 const e=new PhaseA1Error('VERSION_CONFLICT','Refresh.',409);e.currentVersions={brand:2,profile:3};e.dashboardUrl='/dashboard/'+ID;
 const r=errorResponse(e),j=await r.json();assert.equal(r.status,409);assert.deepEqual(j.error.currentVersions,{brand:2,profile:3});assert.equal(j.error.dashboardUrl,'/dashboard/'+ID);
});

 test('A5 migration preserves A1 memberships and adds safe invitation constraints',async()=>{
  const {PGlite}=await import('@electric-sql/pglite');const {readFile}=await import('node:fs/promises');const pg=new PGlite();
  try{await pg.exec(await readFile(new URL('../backend/migrations/001_integrated_phase_a1.sql',import.meta.url),'utf8'));await pg.exec(await readFile(new URL('../backend/migrations/006_integrated_phase_a5.sql',import.meta.url),'utf8'));
   const org=ID,user='clerk-test';await pg.query('INSERT INTO organizers(id,slug,name) VALUES($1,$2,$3)',[org,'test-brand','Test Brand']);await pg.query("INSERT INTO organizer_members(organizer_id,clerk_user_id,role) VALUES($1,$2,'owner')",[org,user]);
   const member=(await pg.query('SELECT id,version FROM organizer_members WHERE organizer_id=$1',[org])).rows[0];assert.match(member.id,/^[0-9a-f-]{36}$/);assert.equal(member.version,1);
   await assert.rejects(pg.query("INSERT INTO organizer_invitations(id,organizer_id,role,token_hash,created_by_clerk_user_id,expires_at,idempotency_key,request_hash) VALUES($1,$2,'owner',$3,$4,now()+interval '7 days',$5,$6)",[crypto.randomUUID(),org,'a'.repeat(64),user,crypto.randomUUID(),'b'.repeat(64)]));
  }finally{await pg.close();}
 });

import {acceptInviteTx,storefrontEventsWithDb} from '../lib/integrated-phase-a5-core.mjs';
test('private invite is one-use and exact-key acceptance replays',async()=>{
 const {PGlite}=await import('@electric-sql/pglite'),{readFile}=await import('node:fs/promises');const pg=new PGlite();
 try{for(const name of ['001_integrated_phase_a1.sql','006_integrated_phase_a5.sql'])await pg.exec(await readFile(new URL(`../backend/migrations/${name}`,import.meta.url),'utf8'));
  const org=ID,id=crypto.randomUUID(),k=crypto.randomUUID(),raw='A'.repeat(43),h=crypto.createHash('sha256').update(raw).digest('hex');
  await pg.query("INSERT INTO organizers(id,slug,name) VALUES($1,'invite-brand','Invite Brand')",[org]);
  await pg.query("INSERT INTO organizer_invitations(id,organizer_id,role,token_hash,created_by_clerk_user_id,expires_at,idempotency_key,request_hash) VALUES($1,$2,'editor',$3,'owner',now()+interval '7 days',$4,$5)",[id,org,h,crypto.randomUUID(),'b'.repeat(64)]);
  const q=async(t,p)=>(await pg.query(t,p)).rows;
  const first=await acceptInviteTx(q,{raw,user:'invitee',idempotencyKey:k});const again=await acceptInviteTx(q,{raw,user:'invitee',idempotencyKey:k});assert.deepEqual(again,first);assert.equal(first.membership.role,'editor');
  await assert.rejects(acceptInviteTx(q,{raw,user:'other',idempotencyKey:crypto.randomUUID()}),e=>e.code==='INVITATION_ALREADY_USED');
  await assert.rejects(acceptInviteTx(q,{raw,user:'invitee',idempotencyKey:crypto.randomUUID()}),e=>e.code==='INVITATION_ALREADY_ACCEPTED'&&e.dashboardUrl===first.dashboardUrl);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM organizer_members')).rows[0].n,1);
 }finally{await pg.close();}
});
test('storefront pages published events and excludes cancelled ones',async()=>{
 const {PGlite}=await import('@electric-sql/pglite'),{readFile}=await import('node:fs/promises');const pg=new PGlite();
 try{await pg.exec(await readFile(new URL('../backend/migrations/001_integrated_phase_a1.sql',import.meta.url),'utf8'));
  await pg.exec("CREATE TABLE public_events(id uuid PRIMARY KEY,organizer_id uuid NOT NULL,status text NOT NULL,snapshot jsonb NOT NULL); CREATE TABLE public_occurrences(id uuid PRIMARY KEY,event_id uuid NOT NULL,starts_at_utc timestamptz NOT NULL,start_local text,time_zone text); CREATE TABLE public_tiers(id uuid PRIMARY KEY,event_id uuid NOT NULL,position int,price_minor int);");
  await pg.query("INSERT INTO organizers(id,slug,name) VALUES($1,'storefront-brand','Storefront Brand')",[ID]);
  const make=async(title,status,days)=>{const id=crypto.randomUUID(),occ=crypto.randomUUID(),snapshot={title,type:'event',sameLocation:true,businessLocation:{name:'Venue',address:'1 Main Street',latitude:40,longitude:-73},coverAssetId:null};await pg.query('INSERT INTO public_events(id,organizer_id,status,snapshot) VALUES($1,$2,$3,$4::jsonb)',[id,ID,status,JSON.stringify(snapshot)]);await pg.query('INSERT INTO public_occurrences(id,event_id,starts_at_utc,start_local,time_zone) VALUES($1,$2,now()+($3::int*interval \'1 day\'),\'2030-01-01T12:00\',\'America/New_York\')',[occ,id,days]);return id;};
  const early=await make('Early','published',1),late=await make('Late','published',3);await make('Cancelled','cancelled',2);
  const q=async(t,p)=>(await pg.query(t,p)).rows;const first=await storefrontEventsWithDb(ID,new URLSearchParams('limit=1'),q);assert.deepEqual(first.events.map(x=>x.id),[early]);assert.ok(first.nextCursor);const second=await storefrontEventsWithDb(ID,new URLSearchParams('limit=1&cursor='+encodeURIComponent(first.nextCursor)),q);assert.deepEqual(second.events.map(x=>x.id),[late]);assert.equal(second.nextCursor,null);
 }finally{await pg.close();}
});
