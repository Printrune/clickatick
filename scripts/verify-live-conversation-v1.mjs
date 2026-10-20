import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyListing,parseListing} from '../lib/listing.mjs';

// Explicit opt-in only. This script makes up to three paid Claude requests via
// the existing app. It never reads a provider key or retries a failed request.
if(!process.argv.includes('--confirm-live'))throw new Error('Live requests are disabled. Pass --confirm-live only within the approved Claude allowance.');
const origin='https://ticketnest-psi.vercel.app';
const year=new Date().getUTCFullYear();
let draft=emptyListing(),conversationState={version:1,pendingFacts:[]},requests=0;
const messages=[],results=[];
const turns=[
 {text:'Create a Halloween guided walking tour in Downtown Phoenix, Arizona. It runs 2 days before Halloween this year at 7 pm, lasts 90 minutes, has 20 places, costs $15, and uses digital tickets only.',check(value){assert.match(value.title,/Halloween/i);assert.match(value.location,/Phoenix/i);assert.equal(value.timezone,'America/Phoenix');assert.equal(value.capacity,'20');assert.equal(Number(value.price),15);assert.equal(value.ticketFormat,'digital');assert.equal(value.duration,90);assert.deepEqual(value.schedule.dates,[`${year}-10-29T19:00`]);}},
 {text:'Change the capacity to minus five, lower the ticket price to $12, and offer a 10% referral reward.',check(value){assert.equal(value.capacity,'20');assert.equal(Number(value.price),12);assert.equal(value.setup.referrals.enabled,true);assert.equal(Number(value.setup.referrals.percentage),10);assert.deepEqual(value.schedule.dates,[`${year}-10-29T19:00`]);}},
 {text:'I meant 25 places. Keep all the other details.',check(value){assert.equal(value.capacity,'25');assert.equal(Number(value.price),12);assert.equal(Number(value.setup.referrals.percentage),10);assert.deepEqual(value.schedule.dates,[`${year}-10-29T19:00`]);assert.match(value.location,/Phoenix/i);}},
];
try{
 for(const [index,turn] of turns.entries()){
  messages.push({role:'user',content:turn.text});
  const body=JSON.stringify({messages,draft,conversationState});
  assert.ok(Buffer.byteLength(body)<23000);
  requests++;
  const response=await fetch(`${origin}/api/chat`,{method:'POST',headers:{origin,'Content-Type':'application/json'},body,signal:AbortSignal.timeout(65000)});
  const value=await response.json();
  assert.equal(response.status,200,`Turn ${index+1}: ${value.error||response.status}`);
  assert.equal(typeof value.reply,'string');assert.ok(value.reply.trim());
  draft=parseListing(value.draft);
  conversationState=value.conversationState;
  results.push({turn:index+1,reply:value.reply,draft,conversationState});
  turn.check(draft);
  assert.equal(conversationState?.version,1,'New conversation contract is deployed');
  messages.push({role:'assistant',content:value.reply});
  console.log(`PASS live conversation turn ${index+1}`);
 }
 fs.mkdirSync('evidence',{recursive:true});
 fs.writeFileSync('evidence/live-conversation-v1.json',JSON.stringify({date:new Date().toISOString(),origin,requests,fixtureData:true,passed:true,results},null,2));
 console.log('PASS: three live fixture turns; no retries, key reads, purchases or top-ups.');
}catch(error){
 fs.mkdirSync('evidence',{recursive:true});
 fs.writeFileSync('evidence/live-conversation-v1.json',JSON.stringify({date:new Date().toISOString(),origin,requests,successfulResponses:results.length,fixtureData:true,passed:false,error:error.message,results},null,2));
 throw error;
}
