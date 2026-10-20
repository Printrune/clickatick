import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyListing} from '../lib/listing.mjs';
import {acceptedDraftUpdate,savedSceneProgress,clearPendingFields,changedSetupPendingFields} from '../lib/chat-client.mjs';
import {chatPayload} from '../lib/chat-context.mjs';

test('clarification without accepted changes never marks the raw answer saved',()=>{
 const before=emptyListing(),result=acceptedDraftUpdate(before,structuredClone(before));
 assert.equal(result.changed,false);assert.equal(result.note,'');assert.deepEqual(result.draft,before);
});
test('mixed answer feedback describes accepted facts rather than rejected words',()=>{
 const before=emptyListing(),after={...before,capacity:'50'};
 const result=acceptedDraftUpdate(before,after);
 assert.equal(result.changed,true);assert.match(result.note,/50 guest places/);assert.doesNotMatch(result.note,/referral|100%/);
 assert.equal(before.capacity,'');
});
test('invalid response cannot overwrite accepted client draft',()=>{
 const before={...emptyListing(),capacity:'20'};
 assert.throws(()=>acceptedDraftUpdate(before,{...before,capacity:'many'}));assert.equal(before.capacity,'20');
});
test('confirmed progress restores explicitly; old message counts are never acceptance evidence',()=>{
 assert.deepEqual(savedSceneProgress({revision:4,note:'50 guest places'}),{revision:4,note:'50 guest places'});
 for(const value of [undefined,{revision:-1,note:'bad'},{revision:2,note:'x'.repeat(121)}])assert.deepEqual(savedSceneProgress(value),{revision:0,note:''});
});
test('unresolved facts survive trimmed history and are counted within the UTF8 request limit',()=>{
 const conversationState={version:1,pendingFacts:[{field:'schedule',sourceText:'2 days before Halloween'},{field:'schedule',sourceText:'2026'}]};
 const draft=emptyListing(),messages=Array.from({length:60},(_,i)=>({role:i%2?'assistant':'user',content:'🎟'.repeat(300)}));messages.push({role:'user',content:'7 PM'});
 const payload=chatPayload(messages,draft,conversationState);
 assert.deepEqual(payload.conversationState,conversationState);assert.equal(payload.messages.at(-1).content,'7 PM');assert.equal(payload.draft,draft);
 assert(new TextEncoder().encode(JSON.stringify(payload)).length<=23000);assert(payload.messages.length<=20);
});

test('explicit manual correction resolves only the edited pending group',()=>{
 const state={version:1,pendingFacts:[{field:'price',sourceText:'tickets cost bananas'},{field:'capacity',sourceText:'many guests'},{field:'schedule',sourceText:'2 days before Halloween'}]};
 const result=clearPendingFields(state,['price','capacity','ticketTiers']);
 assert.deepEqual(result.pendingFacts,[state.pendingFacts[2]]);assert.equal(state.pendingFacts.length,3);
});

test('manual shared inventory edit clears inventory questions but keeps price and date questions',()=>{
 const before=emptyListing().setup,after={...before,inventoryMode:'shared'};
 const fields=changedSetupPendingFields(before,after);
 assert.deepEqual(fields,['inventoryMode','ticketTiers','capacity']);
 const state={version:1,pendingFacts:['inventoryMode','ticketTiers','capacity','price','schedule'].map(field=>({field,sourceText:'Please clarify'}))};
 assert.deepEqual(clearPendingFields(state,fields).pendingFacts.map(fact=>fact.field),['price','schedule']);
 assert.deepEqual(changedSetupPendingFields(after,structuredClone(after)),[]);
});

test('shared total ten survives accepted client merge with stable adult and child categories',()=>{
 const before=emptyListing();before.capacity='10';before.ticketTiers=[{id:'11111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'30',quantity:'6'},{id:'22222222-2222-4222-8222-222222222222',name:'Child',description:'',price:'20',quantity:'4'}];
 const response={...structuredClone(before),setup:{...before.setup,inventoryMode:'shared'}};
 const result=acceptedDraftUpdate(before,response);
 assert.equal(result.changed,true);assert.equal(result.draft.setup.inventoryMode,'shared');assert.equal(result.draft.capacity,'10');
 assert.deepEqual(result.draft.ticketTiers,before.ticketTiers);assert.equal(result.draft.price,'20.00');
});
