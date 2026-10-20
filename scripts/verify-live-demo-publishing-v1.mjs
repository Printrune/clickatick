import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {emptyListing} from '../lib/listing.mjs';

// Explicit creation of a public fictional demo, never a real paid booking.
if(!process.argv.includes('--confirm-public-demo'))throw Error('Public demo creation requires --confirm-public-demo.');
const origin='https://ticketnest-psi.vercel.app';
const evidence='evidence/live-demo-publishing-v1.json';
let saved;try{saved=JSON.parse(fs.readFileSync(evidence,'utf8'));}catch{}
const adult={id:'11111111-1111-4111-8111-111111111111',name:'Adult',description:'Demo adult ticket',price:'20',quantity:'10'};
const child={id:'22222222-2222-4222-8222-222222222222',name:'Child',description:'Demo child ticket',price:'10',quantity:'10'};
const base=emptyListing();
const draft={...base,title:'Demo Halloween Walking Tour',description:'Try clickatick with a fictional Halloween walking tour. This is a public demonstration. No tour will take place and demo tickets do not grant admission.',location:'Downtown Phoenix, Arizona',timezone:'America/Phoenix',price:'10',capacity:'10',duration:90,ticketFormat:'digital',ticketTiers:[adult,child],setup:{...base.setup,inventoryMode:'shared',restrictions:'Demonstration only. Do not travel to this event.',disclaimer:'This fictional listing is for testing clickatick. Demo confirmations are not valid admission tickets.',disclaimerReviewed:true,refundPolicy:'No payment is taken during this demonstration.',referrals:{enabled:true,percentage:'10'},paymentPreferences:['card','bank-transfer','digital-wallet','bitcoin','crypto','epay']},schedule:{kind:'dates',dates:['2026-10-29T19:00'],start:'',until:'',time:'',weekdays:[]}};
const intent=saved?.intent||{listingId:randomUUID(),receiptId:randomUUID()};
const result={date:new Date().toISOString(),origin,fixtureData:true,intent,passed:false,checks:[]};
fs.mkdirSync('evidence',{recursive:true});
fs.writeFileSync(evidence,JSON.stringify(result,null,2));
const check=name=>{result.checks.push(name);console.log(`PASS ${name}`);};
async function post(path,body){const response=await fetch(origin+path,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});return {status:response.status,body:await response.json()};}
try{
 const created=await post('/api/demo/listings',{id:intent.listingId,draft});
 assert.ok([200,201].includes(created.status),JSON.stringify(created));assert.equal(created.body.url,`/listing/${intent.listingId}`);check('anonymous immutable public listing stored');
 result.listingUrl=origin+created.body.url;
 const repeat=await post('/api/demo/listings',{id:intent.listingId,draft});assert.equal(repeat.status,200);assert.equal(repeat.body.url,created.body.url);check('publish replay returns same listing');
 const collision=await post('/api/demo/listings',{id:intent.listingId,draft:{...draft,title:'A conflicting title'}});assert.equal(collision.status,409);check('published snapshot cannot be overwritten');
 const publicRead=await fetch(result.listingUrl,{signal:AbortSignal.timeout(30000)});assert.equal(publicRead.status,200);assert.match(await publicRead.text(),/Demo Halloween Walking Tour/);check('public listing read from a separate request');
 const path=`/api/demo/listings/${intent.listingId}/checkout`;
 const order={id:intent.receiptId,occurrence:'2026-10-29T19:00',items:[{tierId:adult.id,quantity:2},{tierId:child.id,quantity:2}],acknowledged:true};
 const over=await post(path,{...order,id:randomUUID(),items:[{tierId:adult.id,quantity:6},{tierId:child.id,quantity:5}]});assert.equal(over.status,400);check('shared total10 rejects combined basket11');
 const checkout=await post(path,order);assert.ok([200,201].includes(checkout.status),JSON.stringify(checkout));assert.equal(checkout.body.receipt.totalCents,6000);assert.equal(checkout.body.receipt.chargedCents,0);assert.equal(checkout.body.receipt.demo,true);assert.equal(checkout.body.url,`/receipt/${intent.receiptId}`);check('multi-category demo purchase stores zero-charge receipt');
 const replay=await post(path,order);assert.equal(replay.status,200);assert.deepEqual(replay.body.receipt,checkout.body.receipt);check('checkout replay returns same persisted receipt');
 result.receiptUrl=origin+checkout.body.url;result.receipt=checkout.body.receipt;
 const receiptRead=await fetch(result.receiptUrl,{signal:AbortSignal.timeout(30000)});assert.equal(receiptRead.status,200);const html=await receiptRead.text();assert.match(html,/Demo Halloween Walking Tour/);assert.match(html,/demo/i);check('persistent confirmation opens on a separate request');
 result.passed=true;
}catch(error){result.error=error.message;throw error;}
finally{fs.writeFileSync(evidence,JSON.stringify(result,null,2));}
