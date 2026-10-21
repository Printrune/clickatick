import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDemoService} from '../lib/demo-service.mjs';
import {emptyListing,parseListing} from '../lib/listing.mjs';

const prefix='clickatick-demo/v1';
const environment=()=>({DEMO_PUBLISHING_ENABLED:'true',BLOB_READ_WRITE_TOKEN:'fixture'});
const draft=(title,type='event')=>parseListing({...emptyListing(),title,type,description:'A guided experience.',location:'Phoenix',price:'20',capacity:'10',schedule:{...emptyListing().schedule,dates:['2026-10-29T18:00']}});
function fixture(){
 const objects=new Map(),reads=[];let failPath='';
 const store={
  async read(path){reads.push(path);if(path===failPath)throw new Error('private failure');return objects.get(path)??null;},
  async create(path,record){if(objects.has(path))return {record:objects.get(path),created:false};objects.set(path,record);return {record,created:true};}
 };
 const service=createDemoService({store,environment,now:()=>new Date('2026-10-20T12:00:00.000Z')});
 return {objects,reads,service,failAt:path=>{failPath=path;}};
}
const claimEntries=f=>[...f.objects.entries()].filter(([path])=>path.includes('/quota/listings/'));

test('catalog scans bounded slots and distinguishes empty from unconfigured storage',async()=>{
 const f=fixture();assert.deepEqual(await f.service.readDemoCatalog(),[]);assert.equal(f.reads.length,20);
 const disabled=createDemoService({store:{read:async()=>{throw Error('should not read');}},environment:()=>({})});
 await assert.rejects(disabled.readDemoCatalog(),e=>e.status===503);
});
test('catalog returns sorted small public projections without private draft, hash or artwork',async()=>{
 const f=fixture(),ids=[randomUUID(),randomUUID()];
 await f.service.publish({id:ids[0],draft:draft('Older'),creatorToken:'a'.repeat(64)});
 await f.service.publish({id:ids[1],draft:draft('Newer','activity')});
 const first=f.objects.get(`${prefix}/listings/${ids[0]}.json`);first.createdAt='2026-10-19T12:00:00.000Z';
 const result=await f.service.readDemoCatalog();
 assert.deepEqual(result.map(item=>item.title),['Newer','Older']);
 for(const item of result){assert.deepEqual(Object.keys(item).sort(),['capacity','createdAt','demo','description','id','location','price','scheduleLabel','title','type']);assert.equal(item.demo,true);assert.equal(item.location,'Phoenix');assert.equal(item.price,'20');assert.equal(item.capacity,'10');}
 assert.equal(result[0].type,'activity');assert.match(result[0].scheduleLabel,/2026-10-29/);
});
test('equal timestamps sort by identifier and orphan reservation is skipped',async()=>{
 const f=fixture(),ids=[randomUUID(),randomUUID()];
 for(const id of ids)await f.service.publish({id,draft:draft(id)});
 assert.deepEqual((await f.service.readDemoCatalog()).map(item=>item.id),ids.sort());
 const [path]=claimEntries(f)[0];const claim=f.objects.get(path);f.objects.delete(`${prefix}/listings/${claim.id}.json`);
 assert.equal((await f.service.readDemoCatalog()).length,1);
});
test('malformed claims, mismatched digest and invalid listing fail closed',async()=>{
 const f=fixture(),id=randomUUID();await f.service.publish({id,draft:draft('Tour')});
 const [path,claim]=claimEntries(f)[0];f.objects.set(path,{...claim,kind:'receipts'});
 await assert.rejects(f.service.readDemoCatalog(),e=>e.status===503);
 f.objects.set(path,{...claim,digest:'0'.repeat(64)});
 await assert.rejects(f.service.readDemoCatalog(),e=>e.status===503);
 f.objects.set(path,claim);f.objects.set(`${prefix}/listings/${id}.json`,{invalid:true});
 await assert.rejects(f.service.readDemoCatalog(),e=>e.status===503);
});
test('storage error does not return a partial catalog',async()=>{
 const f=fixture();await f.service.publish({id:randomUUID(),draft:draft('Tour')});
 f.failAt(`${prefix}/quota/listings/019.json`);
 await assert.rejects(f.service.readDemoCatalog(),/private failure/);
});
