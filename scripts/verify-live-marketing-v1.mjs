import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomBytes,randomUUID} from 'node:crypto';
import {emptyListing} from '../lib/listing.mjs';

// Creates one fictional public demo. Never prints or saves the creator credential.
if(!process.argv.includes('--confirm-public-demo'))throw Error('Use --confirm-public-demo to create one fictional listing.');
const origin='https://ticketnest-psi.vercel.app';
const id=randomUUID(),creatorToken=randomBytes(32).toString('hex');
const file='evidence/live-marketing-v1.json';
const evidence={date:new Date().toISOString(),origin,id,fixtureData:true,paidAiRequest:false,passed:false,checks:[]};
const draft={...emptyListing(),title:'Demo: sunset garden walk',description:'Fictional event for testing creator marketing. No event will take place.',location:'Phoenix, Arizona',timezone:'America/Phoenix',price:'12',capacity:'20',ticketFormat:'digital',schedule:{kind:'dates',dates:['2026-10-30T18:00'],start:'',until:'',time:'',weekdays:[]}};
const check=value=>{evidence.checks.push(value);console.log('PASS '+value);};
async function call(path,{method='GET',body,cookie}={}){
 const response=await fetch(origin+path,{method,headers:{origin,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
 let value;try{value=await response.json();}catch{value=null;}
 return {status:response.status,body:value,headers:response.headers};
}
try{
 const published=await call('/api/demo/listings',{method:'POST',body:{id,draft,creatorToken}});
 assert.ok([200,201].includes(published.status),'Publication status '+published.status);
 const setCookie=published.headers.get('set-cookie');assert.ok(setCookie?.includes('HttpOnly'));
 assert.match(setCookie,/SameSite=Strict/i);assert.match(setCookie,/Secure/i);
 const cookie=setCookie.split(';')[0];
 evidence.url=origin+published.body.url;
 check('anonymous publish sets protected creator cookie');
 const path='/api/marketing/'+id;
 const denied=await call(path);assert.equal(denied.status,403);check('public visitor cannot read private workspace');
 const forged=await call(path,{cookie:'ct_creator_'+id+'='+randomBytes(32).toString('hex')});assert.equal(forged.status,403);check('incorrect creator credential is rejected');
 const owner=await call(path,{cookie});assert.equal(owner.status,200);assert.equal(owner.body.listing.id,id);
 assert.deepEqual(owner.body.versions,[]);assert.match(owner.headers.get('cache-control'),/private.*no-store|no-store.*private/i);
 check('creator reads its own empty workspace with private no-store response');
 const versionId=randomUUID(),content={kind:'social',title:draft.title,caption:'Demo listing. Explore the fictional sunset garden walk. Try demo booking.',altText:'Text poster for a fictional garden walk.',placement:'Social post'};
 const save=await call(path,{method:'POST',cookie,body:{id:versionId,draft:content}});assert.ok([200,201].includes(save.status));assert.equal(save.body.version.status,'needs-review');
 const replay=await call(path,{method:'POST',cookie,body:{id:versionId,draft:content}});assert.equal(replay.status,200);assert.equal(replay.body.version.id,versionId);
 check('saved version persists and exact save retry is idempotent');
 const conflict=await call(path,{method:'POST',cookie,body:{id:versionId,draft:{...content,title:'Changed'}}});assert.equal(conflict.status,409);check('saved version cannot be overwritten');
 const approve=await call(path+'/approve',{method:'POST',cookie,body:{versionId}});assert.equal(approve.status,200);assert.equal(approve.body.version.status,'approved');
 const next=await call(path,{method:'POST',cookie,body:{id:randomUUID(),draft:{...content,caption:content.caption+' A revised draft.'}}});assert.ok([200,201].includes(next.status));assert.equal(next.body.version.status,'needs-review');
 const refreshed=await call(path,{cookie});assert.equal(refreshed.status,200);assert.equal(refreshed.body.versions.length,2);assert.equal(refreshed.body.versions.find(v=>v.id===versionId).status,'approved');
 check('approval belongs to exact version and new edit needs review after refresh');
 const external=await fetch(origin+path,{method:'POST',headers:{origin:'https://example.com',cookie,'Content-Type':'application/json'},body:JSON.stringify({id:randomUUID(),draft:content})});assert.equal(external.status,403);check('cross-origin write is rejected');
 const deniedWrite=await call(path,{method:'POST',body:{id:randomUUID(),draft:content}});assert.equal(deniedWrite.status,403);check('public visitor cannot save marketing content');
 if(process.argv.includes('--confirm-one-ai-request')){
  const requestId=randomUUID(),input={id:requestId,draft:content,instruction:'Shorten the caption. Preserve the demo notice and all event facts.'};
  evidence.paidAiRequest=true;
  const refined=await call(path+'/refine',{method:'POST',cookie,body:input});assert.equal(refined.status,200,'Claude refinement status '+refined.status+': '+(refined.body?.error||''));assert.ok(refined.body.draft.caption);
  const repeated=await call(path+'/refine',{method:'POST',cookie,body:input});assert.equal(repeated.status,200);assert.deepEqual(repeated.body.draft,refined.body.draft);
  check('one explicit Claude refinement succeeds and retry uses saved result');
 }
 const revoked=await call(path,{method:'DELETE',cookie});assert.equal(revoked.status,200);
 const after=await call(path,{cookie});assert.equal(after.status,403);check('creator revocation prevents further access');
 const publicPage=await fetch(evidence.url,{signal:AbortSignal.timeout(30000)});assert.equal(publicPage.status,200);assert.match(await publicPage.text(),/sunset garden walk/);check('public event remains available after creator access is revoked');
 evidence.passed=true;
}catch(error){evidence.error=error.message;throw error;}
finally{fs.mkdirSync('evidence',{recursive:true});fs.writeFileSync(file,JSON.stringify(evidence,null,2));}
