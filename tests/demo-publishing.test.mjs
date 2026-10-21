import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {emptyListing,parseListing,publicationErrors} from '../lib/listing.mjs';
import {createDemoBlobStore,demoStorageConfigured} from '../lib/demo-blob-store.mjs';
import {createDemoService,demoPublishingReady} from '../lib/demo-service.mjs';
import {demoPublicationErrors,demoOccurrences,demoTicketTypes} from '../lib/demo-validation.mjs';
import {LISTING_BYTES,RECEIPT_BYTES,readDemoJson,demoPostGuard} from '../lib/demo-http.mjs';
const environment=()=>({DEMO_PUBLISHING_ENABLED:'true',BLOB_READ_WRITE_TOKEN:'fixture-only-not-real'});
const time=()=>new Date('2026-10-18T12:00:00.000Z');
const valid=()=>parseListing({...emptyListing(),title:'Halloween tour',description:'Stories on a guided walk.',location:'Phoenix',timezone:'America/Phoenix',price:'20',capacity:'10',ticketFormat:'digital',schedule:{...emptyListing().schedule,dates:['2026-10-29T18:00']}});
function fixture(){
 const objects=new Map(),calls=[];let fail=null;
 const sdk={
  async get(path,options){calls.push({method:'get',path,options});assert.equal(options.access,'private');assert.equal(options.useCache,false);assert.ok(options.abortSignal instanceof AbortSignal);const body=objects.get(path);if(body===undefined)return null;return {statusCode:200,stream:new Response(body).body,headers:new Headers(),blob:{size:Buffer.byteLength(body)}};},
  async put(path,body,options){calls.push({method:'put',path,options});assert.equal(options.access,'private');assert.equal(options.addRandomSuffix,false);assert.equal(options.allowOverwrite,false);assert.equal(options.contentType,'application/json');assert.ok(options.abortSignal instanceof AbortSignal);if(objects.has(path))throw new Error('already exists');if(fail?.when==='before'&&path.includes(fail.match)){fail=null;throw new Error('private storage failure');}objects.set(path,body);if(fail?.when==='after'&&path.includes(fail.match)){fail=null;throw new Error('unknown successful write');}return {pathname:path};}
 };
 const store=createDemoBlobStore({loadSDK:async()=>sdk}),service=createDemoService({store,environment,now:time});
 return {objects,calls,store,service,failNext:(when,match)=>{fail={when,match};},fresh:()=>createDemoService({store:createDemoBlobStore({loadSDK:async()=>sdk}),environment,now:time})};
}
test('configuration gates recognize token or store/OIDC without claiming service success',()=>{
 assert.equal(demoStorageConfigured({}),false);assert.equal(demoStorageConfigured({BLOB_STORE_ID:'store-fixture'}),true);assert.equal(demoPublishingReady({DEMO_PUBLISHING_ENABLED:'true',BLOB_STORE_ID:'store-fixture'}),true);assert.equal(demoPublishingReady({BLOB_READ_WRITE_TOKEN:'fixture'}),false);assert.equal(demoPublishingReady(environment()),true);assert.equal(demoPublishingReady({DEMO_PUBLISHING_ENABLED:'true',BLOB_STORE_ID:'store-fixture',VERCEL_OIDC_TOKEN:'fixture'}),true);
});
test('extended public demo validation preserves photos/maps/policies while legacy gate remains',()=>{
 const draft=valid(),photo={name:'venue.png',mime:'image/png',dataUrl:'data:image/png;base64,aGVsbG8='};draft.setup.business={address:'Main entrance',lat:'33.45',lng:'-112.07',photo};draft.setup.disclaimer='Follow the guide';assert.ok(demoPublicationErrors(draft).some(e=>e.includes('Review')));draft.setup.disclaimerReviewed=true;assert.deepEqual(demoPublicationErrors(draft),[]);assert.ok(publicationErrors(draft).some(e=>e.includes('device draft')));
});
test('immutable publication stores real snapshot through SDK and reads it through a fresh adapter',async()=>{
 const f=fixture(),id=randomUUID(),draft=valid();draft.setup.business={address:'Main entrance',lat:'33.45',lng:'-112.07',photo:{name:'venue.png',mime:'image/png',dataUrl:'data:image/png;base64,aGVsbG8='}};
 const first=await f.service.publish({id,draft});assert.equal(first.created,true);assert.equal(first.url,`/listing/${id}`);const read=await f.fresh().readDemoListing(id);assert.deepEqual(read.draft,parseListing(draft));assert.equal(read.demo,true);assert.equal(read.createdAt,time().toISOString());assert.equal(read.digest,undefined);assert.equal(read.url,undefined);
 const replay=await f.service.publish({id,draft});assert.equal(replay.created,false);assert.equal([...f.objects.keys()].filter(path=>path.includes('/listings/')&&!path.includes('/quota/')).length,1);
 await assert.rejects(f.service.publish({id,draft:{...draft,title:'Different'}}),e=>e.status===409);
});
test('concurrent same-intent creates converge and conflicting content never overwrites',async()=>{
 const f=fixture(),id=randomUUID(),draft=valid();const same=await Promise.all([f.service.publish({id,draft}),f.service.publish({id,draft})]);assert.equal(same.filter(result=>result.created).length,1);
 const conflictId=randomUUID(),outcomes=await Promise.allSettled([f.service.publish({id:conflictId,draft}),f.service.publish({id:conflictId,draft:{...draft,title:'Other'}})]);assert.equal(outcomes.filter(result=>result.status==='fulfilled').length,1);assert.equal(outcomes.find(result=>result.status==='rejected').reason.status,409);
});
test('unknown successful write is reconciled and failed write adopts its own reservation',async()=>{
 const f=fixture(),draft=valid(),id=randomUUID();f.failNext('after','/v1/listings/');const completed=await f.service.publish({id,draft});assert.equal(completed.id,id);assert.deepEqual((await f.fresh().readDemoListing(id)).draft,draft);
 const failed=randomUUID();f.failNext('before','/v1/listings/');await assert.rejects(f.service.publish({id:failed,draft}),e=>e.status===503);const before=[...f.objects.keys()].filter(path=>path.includes('/quota/listings/')).length;await f.service.publish({id:failed,draft});assert.equal([...f.objects.keys()].filter(path=>path.includes('/quota/listings/')).length,before);
});
test('hard global listing cap is race-safe and replay still works after exhaustion',async()=>{
 const f=fixture(),draft=valid(),ids=Array.from({length:25},()=>randomUUID());const outcomes=await Promise.allSettled(ids.map(id=>f.fresh().publish({id,draft})));assert.equal(outcomes.filter(result=>result.status==='fulfilled').length,20);assert.equal(outcomes.filter(result=>result.status==='rejected'&&result.reason.status===429).length,5);const existing=outcomes.find(result=>result.status==='fulfilled').value;assert.equal((await f.fresh().publish({id:existing.id,draft})).created,false);assert.equal([...f.objects.keys()].filter(path=>path.includes('/quota/listings/')).length,20);
});
test('server-priced shared10 demo basket persists receipt, replays and never decrements stock',async()=>{
 const f=fixture(),draft=valid();draft.setup.inventoryMode='shared';draft.ticketTiers=[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'20',quantity:''},{id:'b1111111-1111-4111-8111-111111111111',name:'Child',description:'',price:'10',quantity:''}];const listingId=randomUUID();await f.service.publish({id:listingId,draft});const id=randomUUID(),input={id,occurrence:draft.schedule.dates[0],items:[{tierId:draft.ticketTiers[0].id,quantity:6},{tierId:draft.ticketTiers[1].id,quantity:4}],acknowledged:true};
 const result=await f.service.checkout(listingId,input);assert.equal(result.created,true);assert.equal(result.receipt.totalCents,16000);assert.equal(result.receipt.chargedCents,0);assert.equal(result.receipt.status,'demo');assert.equal(result.url,`/receipt/${id}`);assert.equal(result.coverImage,null);assert.deepEqual(await f.fresh().readDemoReceipt(id),{...result.receipt,coverImage:null});assert.equal((await f.service.checkout(listingId,{...input,items:[...input.items].reverse()})).created,false);
 assert.equal((await f.service.readDemoListing(listingId)).draft.capacity,'10');await f.service.checkout(listingId,{...input,id:randomUUID()});assert.equal((await f.service.readDemoListing(listingId)).draft.capacity,'10');
 await assert.rejects(f.service.checkout(listingId,{...input,id:randomUUID(),items:[{tierId:draft.ticketTiers[0].id,quantity:6},{tierId:draft.ticketTiers[1].id,quantity:5}]}),e=>e.status===400);
 await assert.rejects(f.service.checkout(listingId,{...input,items:[{tierId:draft.ticketTiers[0].id,quantity:1}]}),e=>e.status===409);
});
test('checkout rejects PII, client prices, duplicate categories, unacknowledged and invalid dates before writes',async()=>{
 const f=fixture(),draft=valid(),listingId=randomUUID();await f.service.publish({id:listingId,draft});const base={id:randomUUID(),occurrence:draft.schedule.dates[0],items:[{tierId:'general',quantity:1}],acknowledged:true};
 for(const input of [{...base,email:'person@example.test'},{...base,card:'fixture'},{...base,items:[{tierId:'general',quantity:1,price:0}]},{...base,items:[{tierId:'general',quantity:1},{tierId:'general',quantity:1}]},{...base,occurrence:'tomorrow'},{...base,acknowledged:false},{...base,items:[{tierId:'unknown',quantity:1}]},{...base,items:[{tierId:'general',quantity:21}]}])await assert.rejects(f.service.checkout(listingId,input),e=>e.status===400);
 assert.equal([...f.objects.keys()].filter(path=>path.includes('/receipts/')).length,0);
});
test('100 receipt cap is global, existing receipt remains replayable and unreadable storage is not success',async()=>{
 const f=fixture(),draft=valid(),listingId=randomUUID();await f.service.publish({id:listingId,draft});const inputs=Array.from({length:102},()=>({id:randomUUID(),occurrence:draft.schedule.dates[0],items:[{tierId:'general',quantity:1}],acknowledged:true}));const results=await Promise.allSettled(inputs.map(input=>f.fresh().checkout(listingId,input)));assert.equal(results.filter(result=>result.status==='fulfilled').length,100);assert.equal(results.filter(result=>result.status==='rejected'&&result.reason.status===429).length,2);const first=results.findIndex(result=>result.status==='fulfilled');assert.equal((await f.service.checkout(listingId,inputs[first])).created,false);
 const path=[...f.objects.keys()].find(path=>path.includes('/listings/')&&!path.includes('/quota/'));f.objects.set(path,'invalid JSON');await assert.rejects(f.fresh().readDemoListing(listingId),e=>e.status===503);
});
test('weekly occurrence and category UI helpers share exact server choices',()=>{
 const draft=valid();draft.type='activity';draft.schedule={kind:'weekly',dates:[],start:'2026-10-26',until:'2026-11-01',time:'18:00',weekdays:[1,3,5]};assert.deepEqual(demoOccurrences(draft),['2026-10-26T18:00','2026-10-28T18:00','2026-10-30T18:00']);assert.deepEqual(demoTicketTypes(draft),[{id:'general',name:'General admission',priceCents:2000,capacity:10}]);
});
test('bounded stream rejects missing/malformed and oversized bodies even without Content-Length',async()=>{
 await assert.rejects(readDemoJson(null,100),e=>e.status===400);await assert.rejects(readDemoJson(new Response('bad').body,100),e=>e.status===400);await assert.rejects(readDemoJson(new Response('x'.repeat(LISTING_BYTES+1)).body,LISTING_BYTES),e=>e.status===413);
 for(let i=0;i<30;i++)demoPostGuard(new Request('https://example.test'),123456000);assert.throws(()=>demoPostGuard(new Request('https://example.test'),123456000),e=>e.status===429);
});
test('reserved failed intent can still finish after every global listing slot is occupied',async()=>{
 const f=fixture(),draft=valid(),id=randomUUID();f.failNext('before','/v1/listings/');await assert.rejects(f.service.publish({id,draft}),e=>e.status===503);
 for(let i=0;i<19;i++)await f.fresh().publish({id:randomUUID(),draft});await assert.rejects(f.service.publish({id:randomUUID(),draft}),e=>e.status===429);assert.equal((await f.fresh().publish({id,draft})).created,true);assert.equal([...f.objects.keys()].filter(path=>path.includes('/quota/listings/')).length,20);
});
test('corrupted receipt with internally consistent prices but stale digest cannot be read as confirmed',async()=>{
 const f=fixture(),draft=valid(),listingId=randomUUID(),id=randomUUID();await f.service.publish({id:listingId,draft});await f.service.checkout(listingId,{id,occurrence:draft.schedule.dates[0],items:[{tierId:'general',quantity:1}],acknowledged:true});
 const path=`clickatick-demo/v1/receipts/${id}.json`,record=JSON.parse(f.objects.get(path));record.receipt.items[0].unitPriceCents=1;record.receipt.items[0].lineTotalCents=1;record.receipt.totalCents=1;f.objects.set(path,JSON.stringify(record));await assert.rejects(f.fresh().readDemoReceipt(id),e=>e.status===503);
});
async function routeHandlers(service){
 globalThis.__demoRouteService=service;
 const rewrite=async(path,depth)=>{
  let source=await readFile(new URL(path,import.meta.url),'utf8');
  source=source.replace(`'${depth}lib/creator-neon-cutover.mjs'`,JSON.stringify(new URL('../lib/creator-neon-cutover.mjs',import.meta.url).href));
  source=source.replace(`import {sameOrigin} from '${depth}lib/services';`,"const sameOrigin=request=>request.headers.get('origin')==='https://example.test';");
  source=source.replace(`import {publishDemoListing} from '${depth}lib/demo-service.mjs';`,"const publishDemoListing=input=>globalThis.__demoRouteService.publish(input);");
  source=source.replace(`import {checkoutDemoListing} from '${depth}lib/demo-service.mjs';`,"const checkoutDemoListing=(id,input)=>globalThis.__demoRouteService.checkout(id,input);");
  source=source.replace(`'${depth}lib/marketing-http.mjs'`,JSON.stringify(new URL('../lib/marketing-http.mjs',import.meta.url).href));
  source=source.replace(`'${depth}lib/demo-http.mjs'`,JSON.stringify(new URL('../lib/demo-http.mjs',import.meta.url).href));
  return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).POST;
 };
 return {publish:await rewrite('../app/api/demo/listings/route.js','../../../../'),checkout:await rewrite('../app/api/demo/listings/[id]/checkout/route.js','../../../../../../')};
}
const request=(body,origin='https://example.test')=>new Request('https://example.test/api/demo/listings',{method:'POST',headers:{origin,'content-type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)});
test('actual anonymous routes publish, publicly read, demo-checkout, read receipt and replay without auth',async()=>{
 const f=fixture(),routes=await routeHandlers(f.service),id=randomUUID(),draft=valid();const publish=await routes.publish(request({id,draft}));assert.equal(publish.status,201);assert.deepEqual(await publish.json(),{id,url:`/listing/${id}`,demo:true});assert.equal((await f.fresh().readDemoListing(id)).draft.title,draft.title);
 const checkoutId=randomUUID(),input={id:checkoutId,occurrence:draft.schedule.dates[0],items:[{tierId:'general',quantity:2}],acknowledged:true};const checkout=await routes.checkout(request(input),{params:Promise.resolve({id})});assert.equal(checkout.status,201);const body=await checkout.json();assert.equal(body.receipt.totalCents,4000);assert.equal(body.receipt.chargedCents,0);assert.equal(body.coverImage,null);assert.deepEqual(await f.fresh().readDemoReceipt(checkoutId),{...body.receipt,coverImage:null});assert.equal((await routes.checkout(request(input),{params:Promise.resolve({id})})).status,200);assert.equal((await routes.publish(request({id,draft}))).status,200);
 delete globalThis.__demoRouteService;
});
test('actual routes reject origin, invalid JSON, oversized body, disabled storage and bad checkout safely',async()=>{
 const f=fixture(),routes=await routeHandlers(f.service),id=randomUUID(),draft=valid();assert.equal((await routes.publish(request({id,draft},'https://foreign.test'))).status,403);assert.equal((await routes.publish(request('invalid JSON'))).status,400);assert.equal((await routes.publish(request('x'.repeat(LISTING_BYTES+1)))).status,413);assert.equal((await routes.publish(request({id,draft:{...draft,title:''}}))).status,400);assert.equal(f.objects.size,0);
 const disabled=createDemoService({store:f.store,environment:()=>({})});globalThis.__demoRouteService=disabled;const unconfigured=await routes.publish(request({id,draft}));assert.equal(unconfigured.status,503);assert.match((await unconfigured.json()).error,/not connected/);assert.equal(f.objects.size,0);
 globalThis.__demoRouteService=f.service;assert.equal((await routes.checkout(request('x'.repeat(RECEIPT_BYTES+1)),{params:Promise.resolve({id})})).status,413);assert.equal((await routes.checkout(request({id:randomUUID(),occurrence:draft.schedule.dates[0],items:[{tierId:'general',quantity:1}],acknowledged:true}),{params:Promise.resolve({id})})).status,404);delete globalThis.__demoRouteService;
});
test('store-ID-only readiness attempts SDK request-context auth and safe503 does not fake persistence',async()=>{
 let reads=0,writes=0;const store=createDemoBlobStore({loadSDK:async()=>({async get(){reads++;throw new Error('private runtime credential details');},async put(){writes++;throw new Error('must not write');}})});
 const service=createDemoService({store,environment:()=>({DEMO_PUBLISHING_ENABLED:'true',BLOB_STORE_ID:'store-fixture-no-env-token'})});
 await assert.rejects(service.publish({id:randomUUID(),draft:valid()}),error=>error.status===503&&!error.message.includes('private runtime'));
 assert.equal(reads,1);assert.equal(writes,0);
});

test('actual route publishes and replays events and activities without a description',async()=>{
 const f=fixture(),routes=await routeHandlers(f.service);
 try{
  for(const type of ['event','activity']){
   const id=randomUUID(),draft={...valid(),type,description:''};
   if(type==='activity')draft.schedule={kind:'weekly',dates:[],start:'2026-10-26',until:'2026-11-01',time:'18:00',weekdays:[1,3,5]};
   assert.deepEqual(demoPublicationErrors(draft),[]);
   assert.equal((await routes.publish(request({id,draft}))).status,201);
   const saved=await f.fresh().readDemoListing(id);assert.equal(saved.draft.description,'');assert.equal(saved.draft.type,type);
   const path=`clickatick-demo/v1/listings/${id}.json`,before=f.objects.get(path);
   assert.equal((await routes.publish(request({id,draft}))).status,200);assert.equal(f.objects.get(path),before);
   assert.ok(publicationErrors(draft).includes('Add the description.'));
  }
 }finally{delete globalThis.__demoRouteService;}
});

test('optional description preserves core requirements, bounds and existing canonical digests',async()=>{
 const f=fixture(),routes=await routeHandlers(f.service),base={...valid(),description:''};
 try{
  for(const key of ['title','location','price','capacity'])assert.equal((await routes.publish(request({id:randomUUID(),draft:{...base,[key]:''}}))).status,400,key);
  assert.equal((await routes.publish(request({id:randomUUID(),draft:{...base,schedule:{...base.schedule,dates:[]}}}))).status,400);
  assert.equal((await routes.publish(request({id:randomUUID(),draft:{...base,description:'x'.repeat(4001)}}))).status,400);
  assert.equal(f.objects.size,0);
  const id=randomUUID(),draft=valid(),digest=createHash('sha256').update(JSON.stringify(draft)).digest('hex');
  await routes.publish(request({id,draft}));const path=`clickatick-demo/v1/listings/${id}.json`,before=f.objects.get(path);
  assert.equal(JSON.parse(before).digest,digest);assert.equal((await routes.publish(request({id,draft}))).status,200);assert.equal(f.objects.get(path),before);
 }finally{delete globalThis.__demoRouteService;}
});
