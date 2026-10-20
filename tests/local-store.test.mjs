import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openLocalStore,localOwner,localMode,loopbackHost,localRequest} from '../lib/local-store.mjs';
import {emptyListing,parseListing} from '../lib/listing.mjs';

test('local access defaults off and rejects remote hosts and Vercel',()=>{
 const old=process.env.LOCAL_MODE,vercel=process.env.VERCEL;
 try{
  delete process.env.LOCAL_MODE;assert.equal(localMode(),false);
  process.env.LOCAL_MODE='true';delete process.env.VERCEL;assert.equal(localMode(),true);
  for(const host of ['localhost:3021','127.0.0.1:3021','[::1]:3021'])assert.equal(loopbackHost(host),true);
  for(const host of ['evil.test','127.0.0.1.evil.test','192.168.1.10:3021'])assert.equal(loopbackHost(host),false);
  assert.equal(localRequest(new Request('http://localhost/',{headers:{host:'evil.test'}})),false);
  process.env.VERCEL='1';assert.equal(localMode(),false);
 }finally{if(old===undefined)delete process.env.LOCAL_MODE;else process.env.LOCAL_MODE=old;if(vercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=vercel;}
});
test('disk database persists sessions, listings and ticket types across restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ticketnest-local-'));let store;
 try{
  store=await openLocalStore(dir);
  assert.equal(await store.session('invalid'),null);
  const token=await store.createSession();assert.equal((await store.session(token)).user.id,localOwner);
  const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const draft=parseListing({...emptyListing(),title:'Disk persistence workshop',description:'Create a ceramic bowl.',location:'Phoenix studio',timezone:'America/Phoenix',price:'15',capacity:'12',schedule:{kind:'dates',dates:['2026-12-05T10:00'],start:'',until:'',time:'',weekdays:[]},ticketTiers:[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',name:'Adult',description:'',price:'15',quantity:'12'}]});
  await store.publish(id,draft,localOwner);await store.publish(id,draft,localOwner);
  assert.equal((await store.listing(id)).length,1);
  await store.close();store=null;store=await openLocalStore(dir);
  assert.equal((await store.session(token)).user.id,localOwner);
  assert.deepEqual((await store.listing(id))[0].content,draft);
  await store.publish(id,{...draft,title:'Updated workshop'},localOwner);
  assert.equal((await store.listing(id))[0].content.title,'Updated workshop');
  await assert.rejects(store.publish(id,{...draft,title:'Unauthorized change'},'22222222-2222-4222-8222-222222222222'),/Log in before publishing/);
  assert.equal((await store.listing(id))[0].content.title,'Updated workshop');
  await store.revoke(token);assert.equal(await store.session(token),null);
  await store.close();store=null;store=await openLocalStore(dir);assert.equal(await store.session(token),null);
 }finally{if(store)await store.close();await rm(dir,{recursive:true,force:true});}
});


