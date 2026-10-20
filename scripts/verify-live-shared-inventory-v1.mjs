import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyListing,parseListing} from '../lib/listing.mjs';

// At most two paid requests. No retries, provider keys or private user data.
if(!process.argv.includes('--confirm-live'))throw Error('Paid requests require --confirm-live within the approved allowance.');
const origin='https://ticketnest-psi.vercel.app';
const adult={id:'11111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'20',quantity:'10'};
const child={id:'22222222-2222-4222-8222-222222222222',name:'Child',description:'',price:'10',quantity:'10'};
let draft=parseListing({...emptyListing(),title:'Demo Halloween walking tour',description:'A fictional guided evening tour for testing.',location:'Downtown Phoenix, Arizona',timezone:'America/Phoenix',price:'10',capacity:'20',ticketFormat:'digital',ticketTiers:[adult,child],schedule:{kind:'dates',dates:['2026-10-29T19:00'],start:'',until:'',time:'',weekdays:[]}});
let conversationState={version:1,pendingFacts:[{field:'capacity',sourceText:'There should be a limit of 10 people in total.'}]};
const results=[];let requests=0;
async function turn(messages){
 requests++;
 const response=await fetch(`${origin}/api/chat`,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({messages,draft,conversationState}),signal:AbortSignal.timeout(65000)});
 const value=await response.json();
 assert.equal(response.status,200,value.error||'Expected successful clarification');
 draft=parseListing(value.draft);conversationState=value.conversationState;
 results.push({reply:value.reply,draft,conversationState});
 assert.doesNotMatch(value.reply,/What ticket category would you like to add or change/i);
 assert.deepEqual(draft.ticketTiers,[adult,child]);
}
try{
 await turn([{role:'assistant',content:'Is the limit of 10 shared across kids and adults, or do you want a set number of spots for each?'},{role:'user',content:'it should between them'}]);
 assert.equal(draft.setup.inventoryMode,'shared');assert.equal(draft.capacity,'10');
 const accepted=structuredClone(draft);
 conversationState={version:1,pendingFacts:[{field:'ticketTiers',sourceText:'There should be a limit of 10 people in total.'}]};
 await turn([{role:'assistant',content:'What ticket category would you like to add or change?'},{role:'user',content:'nothing'}]);
 assert.deepEqual(draft,accepted);assert.equal(conversationState.pendingFacts.some(f=>f.field==='ticketTiers'),false);
 fs.writeFileSync('evidence/live-shared-inventory-v1.json',JSON.stringify({date:new Date().toISOString(),origin,fixtureData:true,requests,passed:true,results},null,2));
 console.log('PASS two live shared-inventory and declined-category turns, no retries.');
}catch(error){
 fs.writeFileSync('evidence/live-shared-inventory-v1.json',JSON.stringify({date:new Date().toISOString(),origin,fixtureData:true,requests,passed:false,error:error.message,results},null,2));throw error;
}
