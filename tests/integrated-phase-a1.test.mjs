import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {createPhaseA1Service,errorResponse,parseCreateBrand} from '../lib/integrated-phase-a1.mjs';
import {createNeonPhaseA1Store} from '../lib/integrated-phase-a1-runtime.mjs';

const env=()=>({CLERK_SECRET_KEY:'fixture',NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'fixture',DATABASE_URL:'fixture'});
const req=body=>new Request('https://clickatick.test/api/v1/organizers',{method:'POST',headers:{origin:'https://clickatick.test',host:'clickatick.test','content-type':'application/json'},body:JSON.stringify(body)});
async function setup(){
 const pg=new PGlite();await pg.exec(await readFile(new URL('../backend/migrations/001_integrated_phase_a1.sql',import.meta.url),'utf8'));
 const store=createNeonPhaseA1Store(async(text,params)=>(await pg.query(text,params)).rows);
 const service=createPhaseA1Service({subject:async()=> 'user_fixture',store:async()=>store,environment:env});
 return {pg,store,service};
}
test('missing integrations and signed-out state are truthful',async()=>{
 let called=false;
 const off=createPhaseA1Service({subject:async()=>{called=true;return 'x';},store:async()=>{called=true;return {};},environment:()=>({})});
 await assert.rejects(off.me(),e=>e.code==='AUTH_UNAVAILABLE'&&e.status===503);assert.equal(called,false);
 const signedOut=createPhaseA1Service({subject:async()=>null,store:async()=>{called=true;return {};},environment:env});
 await assert.rejects(signedOut.me(),e=>e.code==='SIGN_IN_REQUIRED'&&e.status===401);assert.equal(called,false);
 const noDb=createPhaseA1Service({subject:async()=>'user_fixture',store:async()=>({}),environment:()=>({...env(),DATABASE_URL:''})});
 await assert.rejects(noDb.me(),e=>e.code==='DATABASE_UNAVAILABLE'&&e.status===503);
});
test('zero brands, create, 201 replay, multiple brands and deterministic switch list',async()=>{
 const {pg,service}=await setup();try{
  assert.deepEqual(await service.me(),{userId:'user_fixture',brands:[],nextAction:'create-organizer'});
  const key=randomUUID(),body={name:'Zebra Tours',slug:'zebra-tours',idempotencyKey:key};
  const first=await service.create(req(body)),again=await service.create(req(body));assert.deepEqual(again,first);assert.equal(first.dashboardUrl,`/dashboard/${first.brand.id}`);
  await assert.rejects(service.create(req({...body,name:'Changed'})),e=>e.code==='IDEMPOTENCY_CONFLICT'&&e.status===409);
  const second=await service.create(req({name:'Apple Tours',slug:'apple-tours',idempotencyKey:randomUUID()}));
  const me=await service.me();assert.deepEqual(me.brands.map(brand=>brand.name),['Apple Tours','Zebra Tours']);assert.equal(me.nextAction,null);assert.ok(me.brands.every(brand=>brand.permissions.createEvent===false));
  const selected=await service.brand(second.brand.id);assert.equal(selected.brand.name,'Apple Tours');assert.equal(selected.dashboard.message,'Event management is being connected.');
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM organizers')).rows[0].n,2);
 }finally{await pg.close();}
});
test('slug collision, input bounds, origin and bad JSON fail without writes',async()=>{
 const {pg,service}=await setup();try{
  await service.create(req({name:'First Brand',slug:'same-brand',idempotencyKey:randomUUID()}));
  await assert.rejects(service.create(req({name:'Other Brand',slug:'same-brand',idempotencyKey:randomUUID()})),e=>e.code==='SLUG_TAKEN'&&e.status===409);
  for(const bad of [{name:'X',slug:'valid-brand',idempotencyKey:randomUUID()},{name:'Valid Brand',slug:'UPPER',idempotencyKey:randomUUID()},{name:'Valid Brand',slug:'valid-brand',idempotencyKey:'bad'}])assert.throws(()=>parseCreateBrand(bad),e=>e.code==='INVALID_INPUT');
  const foreign=new Request('https://clickatick.test/api/v1/organizers',{method:'POST',headers:{origin:'https://other.test',host:'clickatick.test','content-type':'application/json'},body:JSON.stringify({name:'Foreign Brand',slug:'foreign-brand',idempotencyKey:randomUUID()})});
  await assert.rejects(service.create(foreign),e=>e.code==='WRONG_ORIGIN');
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM organizers')).rows[0].n,1);
 }finally{await pg.close();}
});
test('disabled membership is excluded from me and direct access returns 403; foreign brand is 404',async()=>{
 const {pg,service}=await setup();try{
  const created=await service.create(req({name:'Test Brand',slug:'test-brand',idempotencyKey:randomUUID()}));
  const foreign=createPhaseA1Service({subject:async()=>'user_other',store:async()=>createNeonPhaseA1Store(async(text,params)=>(await pg.query(text,params)).rows),environment:env});
  await assert.rejects(foreign.brand(created.brand.id),e=>e.code==='BRAND_NOT_FOUND'&&e.status===404);
  await pg.query(`UPDATE organizer_members SET status='disabled' WHERE organizer_id=$1`,[created.brand.id]);
  assert.deepEqual((await service.me()).brands,[]);
  await assert.rejects(service.brand(created.brand.id),e=>e.code==='MEMBERSHIP_DISABLED'&&e.status===403);
 }finally{await pg.close();}
});
test('database rate limit and unavailable response envelope',async()=>{
 const {pg,service}=await setup();try{
  for(let i=0;i<10;i++)await service.create(req({name:`Brand ${i}`,slug:`brand-${i}`,idempotencyKey:randomUUID()}));
  await assert.rejects(service.create(req({name:'Another Brand',slug:'another-brand',idempotencyKey:randomUUID()})),e=>e.code==='TOO_MANY_REQUESTS'&&e.status===429);
  const response=errorResponse(new Error('private connection'));assert.equal(response.status,503);assert.deepEqual(await response.json(),{data:null,error:{code:'SERVICE_UNAVAILABLE',message:'Organizer service is unavailable.'}});
 }finally{await pg.close();}
});
test('actual A1 routes return truthful 503 without configured Clerk',async()=>{
 const prior={secret:process.env.CLERK_SECRET_KEY,public:process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY};
 delete process.env.CLERK_SECRET_KEY;delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
 try{
  const me=await import('../app/api/v1/me/route.js');
  const organizers=await import('../app/api/v1/organizers/route.js');
  const brand=await import('../app/api/v1/organizers/[organizerId]/route.js');
  for(const response of [await me.GET(),await organizers.POST(req({name:'Demo Brand',slug:'demo-brand',idempotencyKey:randomUUID()})),await brand.GET(null,{params:Promise.resolve({organizerId:randomUUID()})})]){
   assert.equal(response.status,503);const body=await response.json();assert.equal(body.data,null);assert.equal(body.error.code,'AUTH_UNAVAILABLE');
  }
 }finally{if(prior.secret===undefined)delete process.env.CLERK_SECRET_KEY;else process.env.CLERK_SECRET_KEY=prior.secret;if(prior.public===undefined)delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=prior.public;}
});
