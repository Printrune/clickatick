import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {emptyListing,parseListing,publicationErrors} from '../lib/listing.mjs';
import {answerSchema} from '../lib/claude-ai.mjs';
import {openLocalStore,localOwner} from '../lib/local-store.mjs';

test('ticket delivery retains unknown for legacy drafts and validates explicit formats',()=>{
 const legacy=emptyListing();delete legacy.ticketFormat;
 assert.equal(parseListing(legacy).ticketFormat,'');
 for(const ticketFormat of ['','digital','paper','both'])assert.equal(parseListing({...legacy,ticketFormat}).ticketFormat,ticketFormat);
 for(const ticketFormat of ['phone','Paper',null,{},1])assert.throws(()=>parseListing({...legacy,ticketFormat}),/delivery format/);
 assert.ok(answerSchema.properties.patch.properties.text.items.properties.field.enum.includes('ticketFormat'));
 assert.ok(answerSchema.properties.patch.required.includes('text'));
});

test('actual local PostgreSQL retains delivery format after update and disk restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ticketnest-format-'));let store;
 try{
  store=await openLocalStore(dir);
  const id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const draft=parseListing({...emptyListing(),title:'Halloween walking tour',description:'Guided stories through the old town.',location:'Phoenix',timezone:'America/Phoenix',price:'15',capacity:'20',ticketFormat:'digital',schedule:{...emptyListing().schedule,dates:['2026-10-31T19:00']}});
  assert.deepEqual(publicationErrors(draft),[]);
  await store.publish(id,draft,localOwner);
  assert.equal((await store.listing(id))[0].content.ticketFormat,'digital');
  await store.publish(id,parseListing({...draft,ticketFormat:'both'}),localOwner);
  await store.close();store=null;store=await openLocalStore(dir);
  const restored=parseListing((await store.listing(id))[0].content);
  assert.equal(restored.ticketFormat,'both');assert.equal(restored.capacity,'20');
 }finally{if(store)await store.close();await rm(dir,{recursive:true,force:true});}
});
