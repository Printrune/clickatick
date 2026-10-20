import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {emptyListing} from '../lib/listing.mjs';
if(!process.argv.includes('--confirm-public-demo'))throw Error('Creating a public fictional demo requires --confirm-public-demo.');
const origin='https://ticketnest-psi.vercel.app',file='evidence/live-optional-description-v1.json';
let previous;try{previous=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
const id=previous?.id||randomUUID(),draft={...emptyListing(),title:'Demo: quick ticket setup',description:'',location:'Phoenix, Arizona',timezone:'America/Phoenix',price:'12',capacity:'10',ticketFormat:'digital',schedule:{kind:'dates',dates:['2026-10-30T18:00'],start:'',until:'',time:'',weekdays:[]}};
const evidence={id,origin,date:new Date().toISOString(),fixtureData:true,passed:false,checks:[]};
fs.mkdirSync('evidence',{recursive:true});fs.writeFileSync(file,JSON.stringify(evidence,null,2));
async function publish(){const response=await fetch(origin+'/api/demo/listings',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({id,draft}),signal:AbortSignal.timeout(45000)});return {status:response.status,body:await response.json()};}
try{
 const created=await publish();assert.ok([200,201].includes(created.status),JSON.stringify(created));assert.equal(created.body.url,`/listing/${id}`);evidence.checks.push('empty description accepted and listing persisted');
 const replay=await publish();assert.equal(replay.status,200);assert.equal(replay.body.url,created.body.url);evidence.checks.push('empty description retry is idempotent');
 evidence.url=origin+created.body.url;const response=await fetch(evidence.url,{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);const html=await response.text();assert.match(html,/Demo: quick ticket setup/);assert.doesNotMatch(html,/Your event or activity description will appear here/);evidence.checks.push('public event page opens without a blank-description placeholder');evidence.passed=true;console.log('PASS live optional-description publication, replay and public page.');
}catch(error){evidence.error=error.message;throw error;}finally{fs.writeFileSync(file,JSON.stringify(evidence,null,2));}
