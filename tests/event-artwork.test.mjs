import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {emptyListing,parseListing} from '../lib/listing.mjs';
import {createArtworkService,parseGeneratedCover,positiveGatewayCredit,artworkReady} from '../lib/event-artwork.mjs';
import {createDemoService} from '../lib/demo-service.mjs';
import {DemoError} from '../lib/demo-http.mjs';

const environment=()=>({DEMO_PUBLISHING_ENABLED:'true',BLOB_READ_WRITE_TOKEN:'fixture',EVENT_ARTWORK_GATEWAY_ENABLED:'true',EVENT_ARTWORK_CREDIT_CONFIRMED:'true',AI_GATEWAY_API_KEY:'fixture'});
const valid=()=>({...emptyListing(),title:'Sunset tour',location:'Phoenix',timezone:'America/Phoenix',price:'12',capacity:'20',schedule:{...emptyListing().schedule,dates:['2026-10-29T18:00']}});
const picture=async(origin='scene')=>({mime:'image/jpeg',dataUrl:`data:image/jpeg;base64,${(await sharp({create:{width:8,height:8,channels:3,background:'#6432b0'}}).jpeg().toBuffer()).toString('base64')}`,origin});
function fixture({credit=true,fail=false}={}){
 const records=new Map();let providerCalls=0,creditCalls=0;
 const store={async read(path){return records.get(path)||null;},async create(path,record){if(records.has(path))return {record:records.get(path),created:false};records.set(path,record);return {record,created:true};}};
 const artwork=createArtworkService({store,environment,authorize:async(id,token)=>{if(token!=='valid')throw new DemoError('denied',403);return {id,draft:parseListing({...valid(),coverImage:await picture()})};},checkCredit:async()=>{creditCalls++;return credit;},generate:async()=>{providerCalls++;if(fail)throw new Error('provider offline');return picture('generated');}});
 const demo=createDemoService({store,environment,artwork});
 return {artwork,demo,records,counts:()=>({providerCalls,creditCalls})};
}
test('scene JPEG is bounded, validated, retained, and old listings omit the field',async()=>{
 const scene=await picture();assert.deepEqual(parseListing({...valid(),coverImage:scene}).coverImage,scene);assert.equal(parseListing(valid()).coverImage,undefined);
 for(const image of [{...scene,origin:'generated'},{...scene,mime:'image/png'},{...scene,dataUrl:'data:image/jpeg;base64,YWJj'},{...scene,dataUrl:'data:image/jpeg;base64,'+'A'.repeat(450001)}])assert.throws(()=>parseListing({...valid(),coverImage:image}),/image/);
});
test('disabled or zero credit never claims nor calls the image provider',async()=>{
 assert.equal(artworkReady({}),false);
 assert.equal(await positiveGatewayCredit(environment(),async()=>Response.json({balance:'0'})),false);
 assert.equal(await positiveGatewayCredit(environment(),async()=>Response.json({balance:'1.25'})),true);
 const f=fixture({credit:false}),id=randomUUID();await assert.rejects(f.artwork.create(id,'valid',{id:randomUUID()}),error=>error.status===503);assert.deepEqual(f.counts(),{providerCalls:0,creditCalls:1});assert.equal(f.records.size,0);
});
test('one creator generation attempt creates one private overlay and replay never calls provider twice',async()=>{
 const f=fixture(),id=randomUUID(),requestId=randomUUID();await assert.rejects(f.artwork.create(id,'wrong',{id:requestId}),error=>error.status===403);assert.deepEqual(f.counts(),{providerCalls:0,creditCalls:0});
 const first=await f.artwork.create(id,'valid',{id:requestId});assert.equal(first.created,true);assert.equal(first.coverImage.origin,'generated');assert.equal((await f.artwork.create(id,'valid',{id:requestId})).created,false);assert.equal((await f.artwork.create(id,'valid',{id:randomUUID()})).created,false);assert.deepEqual(f.counts(),{providerCalls:1,creditCalls:1});assert.equal((await f.artwork.read(id)).dataUrl,first.coverImage.dataUrl);
});
test('unknown provider outcome consumes the one attempt and preserves scene fallback',async()=>{
 const f=fixture({fail:true}),id=randomUUID(),requestId=randomUUID();await assert.rejects(f.artwork.create(id,'valid',{id:requestId}),error=>error.status===503);await assert.rejects(f.artwork.create(id,'valid',{id:requestId}),error=>error.status===409);assert.deepEqual(f.counts(),{providerCalls:1,creditCalls:2});assert.equal(await f.artwork.read(id),null);
});
test('concurrent listings share an atomic 20-attempt global ceiling',async()=>{
 const f=fixture(),requests=Array.from({length:23},()=>({listingId:randomUUID(),requestId:randomUUID()}));
 const results=await Promise.allSettled(requests.map(({listingId,requestId})=>f.artwork.create(listingId,'valid',{id:requestId})));
 assert.equal(results.filter(item=>item.status==='fulfilled').length,20);
 assert.equal(results.filter(item=>item.status==='rejected'&&item.reason.status===429).length,3);
 assert.equal(f.counts().providerCalls,20);
 assert.equal([...f.records.keys()].filter(path=>path.includes('/global/')).length,20);
 const first=results.findIndex(item=>item.status==='fulfilled');
 assert.equal((await f.artwork.create(requests[first].listingId,'valid',{id:requests[first].requestId})).created,false);
 assert.equal(f.counts().providerCalls,20);
});
test('published listing and saved demo receipt project the same active image without altering receipt storage',async()=>{
 const f=fixture(),id=randomUUID(),scene=await picture(),draft={...valid(),coverImage:scene};await f.demo.publish({id,draft});assert.equal((await f.demo.readDemoListing(id)).coverImage.origin,'scene');
 const receiptId=randomUUID(),input={id:receiptId,occurrence:'2026-10-29T18:00',items:[{tierId:'general',quantity:1}],acknowledged:true};const checkout=await f.demo.checkout(id,input);assert.equal(checkout.coverImage.origin,'scene');assert.equal((await f.demo.readDemoReceipt(receiptId)).coverImage.origin,'scene');assert.equal(f.records.get(`clickatick-demo/v1/receipts/${receiptId}.json`).receipt.coverImage,undefined);
 await f.artwork.create(id,'valid',{id:randomUUID()});assert.equal((await f.demo.readDemoListing(id)).coverImage.origin,'generated');assert.equal((await f.demo.readDemoReceipt(receiptId)).coverImage.origin,'generated');assert.equal((await f.demo.checkout(id,input)).coverImage.origin,'generated');
});
test('generated data is rejected when malformed',()=>{assert.throws(()=>parseGeneratedCover({mime:'image/jpeg',dataUrl:'data:image/jpeg;base64,YWJj',origin:'generated'}),error=>error.status===503);});
test('actual artwork POST route checks origin and creator cookie and accepts one bounded request',async()=>{
 const f=fixture(),id=randomUUID(),requestId=randomUUID();
 let source=await readFile(new URL('../app/api/demo/listings/[id]/artwork/route.js',import.meta.url),'utf8');
 source=source.replace("'../../../../../../lib/creator-neon-cutover.mjs'",JSON.stringify(new URL('../lib/creator-neon-cutover.mjs',import.meta.url).href));
 source=source.replace("import {sameOrigin} from '../../../../../../lib/services';","const sameOrigin=request=>request.headers.get('origin')==='https://example.test';");
 source=source.replace("import {artworkService} from '../../../../../../lib/event-artwork.mjs';","const artworkService=globalThis.__artworkRouteFixture;");
 source=source.replace("'../../../../../../lib/marketing-http.mjs'",JSON.stringify(new URL('../lib/marketing-http.mjs',import.meta.url).href));
 source=source.replace("'../../../../../../lib/demo-http.mjs'",JSON.stringify(new URL('../lib/demo-http.mjs',import.meta.url).href));
 globalThis.__artworkRouteFixture=f.artwork;
 try{
  const {POST}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const req=(origin,token,body)=>new Request('https://example.test/api/demo/listings/'+id+'/artwork',{method:'POST',headers:{origin,cookie:`ct_creator_${id}=${token}`},body:JSON.stringify(body)});
  assert.equal((await POST(req('https://foreign.test','valid',{id:requestId}),{params:Promise.resolve({id})})).status,403);
  assert.equal((await POST(req('https://example.test','wrong',{id:requestId}),{params:Promise.resolve({id})})).status,403);
  assert.equal(f.counts().providerCalls,0);
  const response=await POST(req('https://example.test','valid',{id:requestId}),{params:Promise.resolve({id})});assert.equal(response.status,200);assert.equal((await response.json()).coverImage.origin,'generated');assert.equal(f.counts().providerCalls,1);
 }finally{delete globalThis.__artworkRouteFixture;}
});
