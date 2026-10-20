import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyListing,parseListing} from '../lib/listing.mjs';
import {parseConversationState} from '../lib/conversation-state.mjs';
import {applyConversationAnswer} from '../lib/conversation-patches.mjs';
const empty=()=>parseConversationState(undefined);
const proposal=(patch,text,pending=[])=>({reply:'Saved. What would you like to add next?',patch,sources:Object.keys(patch).filter(field=>!['clearFields','resolveFields'].includes(field)).map(field=>({field,sourceText:text})),pending});
const run=(patch,text='Use these event details',draft=emptyListing(),state=empty(),pending=[])=>applyConversationAnswer({draft:parseListing(draft),state,messages:[{role:'user',content:text}],answer:proposal(patch,text,pending)});
test('state defaults, strict bounded browser-safe parsing and duplicate-field facts',()=>{
 assert.deepEqual(empty(),{version:1,pendingFacts:[]});
 const state={version:1,pendingFacts:[{field:'schedule',sourceText:'two days before Halloween'},{field:'schedule',sourceText:'2026'}]};assert.deepEqual(parseConversationState(state),state);
 for(const bad of [null,{version:2,pendingFacts:[]},{version:1,pendingFacts:Array(13).fill({field:'price',sourceText:'ten'})},{version:1,pendingFacts:[{field:'photo',sourceText:'image'}]},{version:1,pendingFacts:[{field:'price',sourceText:'x'.repeat(501)}]},{version:1,pendingFacts:Array(12).fill({field:'price',sourceText:'🙂'.repeat(250)})}])assert.throws(()=>parseConversationState(bad));
});
test('independent valid changes survive malformed price, capacity, timezone and setup proposals',()=>{
 for(const patch of [{price:'ten dollars please'},{capacity:'many'},{timezone:'Phoenix probably'},{referralPercentage:'100'},{duration:1},{ticketFormat:'email attachment'},{paymentPreferences:['cash']},{sameLocation:'yes'}]){
  const result=run({title:'Halloween tour',...patch});assert.equal(result.draft.title,'Halloween tour');assert.match(result.reply,/\?/);assert.equal(result.conversationState.pendingFacts.length,1);
  assert.deepEqual(parseListing(result.draft),result.draft);
 }
 const result=run({price:'10',capacity:'many'});assert.equal(result.draft.price,'10');assert.equal(result.draft.capacity,'');assert.match(result.reply,/How many tickets/);
});
test('all editable field families accept grounded valid changes without a full listing rewrite',()=>{
 const fields={title:'Tour',type:'activity',description:'A guided walk',location:'Downtown Phoenix',timezone:'America/Phoenix',price:'10.50',capacity:'20',duration:90,ticketFormat:'digital',restrictions:'Closed shoes',disclaimer:'Use caution',refundPolicy:'Contact organiser',supportiveMessage:true,referralEnabled:true,referralPercentage:'2',paymentPreferences:['card','bitcoin'],businessAddress:'Main entrance',eventAddress:'Other entrance',sameLocation:false};
 const result=run(fields);assert.equal(result.draft.title,'Tour');assert.equal(result.draft.setup.eventLocation.address,'Other entrance');assert.equal(result.draft.setup.referrals.percentage,'2');assert.deepEqual(result.draft.setup.paymentPreferences,['card','bitcoin']);assert.deepEqual(result.conversationState,empty());
});
test('missing evidence and unsupported model fields cannot change draft or falsely claim saved',()=>{
 const draft={...emptyListing(),title:'Accepted'};
 const result=applyConversationAnswer({draft,state:empty(),messages:[{role:'user',content:'Just hello'}],answer:{reply:'Changed your title!',patch:{title:'Invented',photo:'bad'},sources:[],pending:[]}});
 assert.equal(result.draft.title,'Accepted');assert.doesNotMatch(result.reply,/Changed/);assert.match(result.reply,/\?/);
});
test('partial schedule facts remain across year/time turns until complete confirmed date patch',()=>{
 const draft=emptyListing();let state=empty();
 for(const [text,q]of [['2 days before Halloween','Which year is that Halloween?'],['2026','What time should the tour start?']]){
  const result=run({},text,draft,state,[{field:'schedule',sourceText:text,question:q}]);state=result.conversationState;assert.equal(result.reply,q);assert.deepEqual(result.draft.schedule,draft.schedule);
 }
 const messages=[{role:'user',content:'6pm'}],text='6pm';
 const answer=proposal({schedule:{dates:['2026-10-29T18:00']}},text);
 answer.sources.push({field:'schedule',sourceText:'2 days before Halloween'});
 const result=applyConversationAnswer({draft,state,messages,answer});assert.deepEqual(result.draft.schedule.dates,['2026-10-29T18:00']);assert.deepEqual(result.conversationState,empty());
});
test('complete relative phrases can resolve from explicit today without redundant year/time questions',()=>{
 for(const [text,date]of [['tomorrow at 7pm','2026-10-19T19:00'],['two days before Halloween this year at 6pm','2026-10-29T18:00']]){
  const result=run({schedule:{dates:[date]}},text);assert.deepEqual(result.draft.schedule.dates,[date]);assert.deepEqual(result.conversationState,empty());assert.match(result.reply,/add next/);
 }
});
test('malformed schedules retain original calendar, valid other groups survive and reply is truthful',()=>{
 for(const dates of [['2 days before Halloween'],['2026-10-29'],['2026-02-30T18:00']]){
  const draft={...emptyListing(),schedule:{...emptyListing().schedule,dates:['2027-10-20T17:00']}};
  const result=run({title:'New tour',schedule:{dates}},'Change the tour date',draft);assert.equal(result.draft.title,'New tour');assert.deepEqual(result.draft.schedule,draft.schedule);assert.doesNotMatch(result.reply,/Saved/);assert.ok(result.conversationState.pendingFacts.some(f=>f.field==='schedule'));
 }
});
test('invalid group member is identified without parsing validator message text',()=>{
 const draft={...emptyListing(),ticketTiers:[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'Entry',price:'20',quantity:'10'}]};
 const result=run({price:'10',capacity:'many'},'Price ten, capacity many',draft);assert.equal(result.draft.price,'20.00');assert.match(result.reply,/How many tickets/);assert.ok(result.conversationState.pendingFacts.some(f=>f.field==='price'));
});
test('existing category updates preserve identity, omitted categories and server assigns new IDs',()=>{
 const a={id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'Entry',price:'20',quantity:'10'};
 const b={id:'b1111111-1111-4111-8111-111111111111',name:'Child',description:'Entry',price:'10',quantity:'5'};
 const draft={...emptyListing(),ticketTiers:[a,b]};
 const result=run({ticketTiers:[{id:a.id,price:'25'},{id:'new-1',name:'Senior',price:'15',quantity:'5'}]},'Make Adult25 and add Senior15 with five tickets',draft);
 assert.equal(result.draft.ticketTiers[0].id,a.id);assert.equal(result.draft.ticketTiers[0].name,'Adult');assert.deepEqual(result.draft.ticketTiers[1],b);assert.match(result.draft.ticketTiers[2].id,/^[0-9a-f-]{36}$/);assert.equal(result.draft.capacity,'20');
 const bad=run({ticketTiers:[{id:'unknown-id',price:'10'}]},'Change category price',draft);assert.deepEqual(bad.draft.ticketTiers,[a,b]);assert.match(bad.reply,/category/);
});
test('category-derived totals cannot cause an ignored scalar patch to be announced saved',()=>{
 const draft={...emptyListing(),ticketTiers:[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'20',quantity:'10'}]};
 const result=run({price:'12'},'Make tickets twelve',draft);assert.equal(result.draft.price,'20.00');assert.match(result.reply,/category/);assert.doesNotMatch(result.reply,/Saved/);
});
test('unchanged or empty schedule patch cannot erase unresolved date evidence',()=>{
 const state={version:1,pendingFacts:[{field:'schedule',sourceText:'two days before Halloween'}]};
 const result=run({timezone:'America/Phoenix',schedule:{}},'Phoenix timezone',emptyListing(),state);assert.equal(result.draft.timezone,'America/Phoenix');assert.deepEqual(result.conversationState,state);
});
test('explicit clears require affirmative field-specific evidence; nested blank/array clears are rejected',()=>{
 const draft={...emptyListing(),title:'Tour',schedule:{...emptyListing().schedule,dates:['2026-10-29T18:00']},ticketTiers:[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'Entry',price:'20',quantity:'10'}]};draft.setup.paymentPreferences=['card'];
 for(const patch of [{title:''},{schedule:{dates:[]}},{schedule:{time:''}},{ticketTiers:[{id:draft.ticketTiers[0].id,name:''}]},{paymentPreferences:[]}]){
  const result=run(patch,'Change details',draft);assert.equal(result.draft.title,'Tour');assert.deepEqual(result.draft.schedule.dates,draft.schedule.dates);assert.equal(result.draft.ticketTiers[0].name,'Adult');assert.deepEqual(result.draft.setup.paymentPreferences,['card']);
 }
 for(const sourceText of ['Do not remove the title','Remove the disclaimer']){
  const result=applyConversationAnswer({draft:parseListing(draft),state:empty(),messages:[{role:'user',content:sourceText}],answer:{reply:'Removed',patch:{clearFields:['title']},sources:[{field:'title',sourceText}],pending:[]}});assert.equal(result.draft.title,'Tour');assert.doesNotMatch(result.reply,/Removed/);
 }
 const text='Remove the title';const result=applyConversationAnswer({draft:parseListing(draft),state:empty(),messages:[{role:'user',content:text}],answer:{reply:'What next?',patch:{clearFields:['title']},sources:[{field:'title',sourceText:text}],pending:[]}});assert.equal(result.draft.title,'');
});
test('address changes clear pins but keep local venue photo; changed disclaimer resets only review',()=>{
 const photo={name:'venue.png',mime:'image/png',dataUrl:'data:image/png;base64,aGVsbG8='};const draft=emptyListing();Object.assign(draft.setup,{business:{address:'Old',lat:'40',lng:'-70',photo},disclaimer:'Old wording',disclaimerReviewed:true});
 const result=run({businessAddress:'New',disclaimer:'New wording'},'New address and disclaimer',draft);assert.equal(result.draft.setup.business.lat,'');assert.deepEqual(result.draft.setup.business.photo,photo);assert.equal(result.draft.setup.disclaimerReviewed,false);
});
test('pending overflow retains old state and accepted draft, explicitly says new answer is not saved',()=>{
 const state={version:1,pendingFacts:Array.from({length:12},(_,i)=>({field:'schedule',sourceText:`Unresolved date ${i}`}))};
 const result=run({title:'Would otherwise change'},'Add more details',emptyListing(),state,[{field:'price',sourceText:'Add more details',question:'What price?'}]);assert.deepEqual(result.draft,emptyListing());assert.deepEqual(result.conversationState,state);assert.match(result.reply,/not saved yet/);
});
test('malformed model objects never terminate a valid turn or claim invalid data saved',()=>{
 for(const answer of [null,[],{reply:'Saved'}, {reply:42,patch:[],pending:'bad'}]){
  const result=applyConversationAnswer({draft:emptyListing(),state:empty(),messages:[{role:'user',content:'My event idea'}],answer});assert.deepEqual(result.draft,emptyListing());assert.match(result.reply,/\?/);assert.doesNotMatch(result.reply,/Saved/);
 }
});
test('derived values cannot be cleared falsely or erase corresponding pending facts',()=>{
 const draft=emptyListing();draft.setup.business.address='Main entrance';
 const text='Remove the location';const result=applyConversationAnswer({draft:parseListing(draft),state:empty(),messages:[{role:'user',content:text}],answer:{reply:'Removed location',patch:{clearFields:['location']},sources:[{field:'location',sourceText:text}],pending:[]}});
 assert.equal(result.draft.location,'Main entrance');assert.doesNotMatch(result.reply,/Removed/);assert.match(result.reply,/business or attraction address/);
 const withTiers={...emptyListing(),ticketTiers:[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'20',quantity:'10'}]};
 for(const field of ['price','capacity']){const sourceText=`Remove the ${field}`;const response=applyConversationAnswer({draft:parseListing(withTiers),state:empty(),messages:[{role:'user',content:sourceText}],answer:{reply:'Removed',patch:{clearFields:[field]},sources:[{field,sourceText}],pending:[]}});assert.match(response.reply,/category/);assert.doesNotMatch(response.reply,/Removed/);}
});
test('a valid independent patch does not discard the same answer partial pending fact',()=>{
 const state={version:1,pendingFacts:[{field:'schedule',sourceText:'2 days before Halloween'}]},content='2026, call it Spooky Tour';
 const result=applyConversationAnswer({draft:emptyListing(),state,messages:[{role:'assistant',content:'Which year should I use?'},{role:'user',content}],answer:proposal({title:'Spooky Tour'},content)});
 assert.equal(result.draft.title,'Spooky Tour');assert.ok(result.conversationState.pendingFacts.some(f=>f.field==='schedule'&&f.sourceText===content));
 const next=run({schedule:{dates:['2026-10-29T18:00']}},'6pm',result.draft,result.conversationState);assert.deepEqual(next.draft.schedule.dates,['2026-10-29T18:00']);assert.deepEqual(next.conversationState,empty());
});
test('trimmed pending calendar answers avoid redundant year and time questions on malformed provider patch',()=>{
 const state={version:1,pendingFacts:[{field:'schedule',sourceText:'two days before Halloween'},{field:'schedule',sourceText:'2026'},{field:'schedule',sourceText:'6pm'}]};
 const result=run({schedule:{dates:['October 29']}},'Please use those details',emptyListing(),state);assert.match(result.reply,/What exact date/);assert.doesNotMatch(result.reply,/Which year|What time/);
});
test('old resolved price instruction cannot overwrite a later manual edit',()=>{
 const draft={...emptyListing(),price:'25'},messages=[{role:'user',content:'Set the price to10'},{role:'assistant',content:'What next?'},{role:'user',content:'What payment methods can I request?'}];
 const answer={reply:'Price changed to10',patch:{price:'10'},sources:[{field:'price',sourceText:'Set the price to10'}],pending:[]};
 const result=applyConversationAnswer({draft,state:empty(),messages,answer});assert.equal(result.draft.price,'25');assert.doesNotMatch(result.reply,/changed/);
});
test('old resolved category instruction cannot replay and duplicate an existing category',()=>{
 const draft={...emptyListing(),ticketTiers:[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'20',quantity:'10'}]};
 const text='Add Adult tickets for20 with ten places',messages=[{role:'user',content:text},{role:'assistant',content:'What next?'},{role:'user',content:'Make the title Walking Tour'}];
 const answer={reply:'Added another category',patch:{ticketTiers:[{id:'new-1',name:'Adult',price:'20',quantity:'10'}]},sources:[{field:'ticketTiers',sourceText:text}],pending:[]};
 const result=applyConversationAnswer({draft:parseListing(draft),state:empty(),messages,answer});assert.equal(result.draft.ticketTiers.length,1);assert.doesNotMatch(result.reply,/Added/);
});
test('shared inventory mode applies before allocation derivation, preserving every category field',()=>{
 const tiers=[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'Adult entry',price:'20',quantity:'10'},{id:'b1111111-1111-4111-8111-111111111111',name:'Child',description:'Child entry',price:'10',quantity:'10'}];
 const draft=parseListing({...emptyListing(),ticketTiers:tiers}),state={version:1,pendingFacts:[{field:'capacity',sourceText:'There is a limit of 10 total'}]},text='it should between them';
 const answer=proposal({inventoryMode:'shared',capacity:'10'},text);answer.sources=answer.sources.map(source=>source.field==='capacity'?{...source,sourceText:state.pendingFacts[0].sourceText}:source);
 const result=applyConversationAnswer({draft,state,messages:[{role:'assistant',content:'Is the limit of 10 shared across kids and adults, or do you want a set number of spots for each?'},{role:'user',content:text}],answer});
 assert.equal(result.draft.setup.inventoryMode,'shared');assert.equal(result.draft.capacity,'10');assert.deepEqual(result.draft.ticketTiers,tiers);assert.deepEqual(result.conversationState.pendingFacts,[]);assert.doesNotMatch(result.reply,/What ticket category/);
});
test('shared inventory accepts incomplete category allocations without assigning total to each category',()=>{
 const draft=emptyListing();draft.setup.inventoryMode='shared';draft.capacity='10';draft.ticketTiers=[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'20',quantity:''},{id:'b1111111-1111-4111-8111-111111111111',name:'Child',description:'',price:'10',quantity:''}];
 const result=run({inventoryMode:'shared'},'The 10 places are shared',draft);assert.equal(result.draft.capacity,'10');assert.deepEqual(result.draft.ticketTiers.map(tier=>tier.quantity),['','']);assert.equal(result.draft.ticketTiers.length,2);
});
test('explicit Nothing settles stale category context without editing categories or clearing unrelated facts',()=>{
 const draft=parseListing({...emptyListing(),ticketTiers:[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'20',quantity:'10'}]}),state={version:1,pendingFacts:[{field:'ticketTiers',sourceText:'it should between them'},{field:'schedule',sourceText:'Halloween'}]},text='nothing';
 const answer={reply:'What ticket category would you like to add or change?',patch:{resolveFields:['ticketTiers']},sources:[{field:'ticketTiers',sourceText:text}],pending:[]};
 const result=applyConversationAnswer({draft,state,messages:[{role:'assistant',content:'What ticket category would you like to add or change?'},{role:'user',content:text}],answer});
 assert.deepEqual(result.draft,draft);assert.deepEqual(result.conversationState.pendingFacts,[state.pendingFacts[1]]);assert.match(result.reply,/stay as they are/);assert.doesNotMatch(result.reply,/What ticket category/);
});
test('pending resolution needs latest scoped decline and cannot hide rejected or blocked proposals',()=>{
 const state={version:1,pendingFacts:[{field:'ticketTiers',sourceText:'Adult tickets'}]},draft=emptyListing();
 const base={reply:'Kept as they are',patch:{resolveFields:['ticketTiers']},sources:[{field:'ticketTiers',sourceText:'nothing'}],pending:[]};
 const unrelated=applyConversationAnswer({draft,state,messages:[{role:'assistant',content:'What disclaimer should guests see?'},{role:'user',content:'nothing'}],answer:base});assert.ok(unrelated.conversationState.pendingFacts.some(f=>f.field==='ticketTiers'));
 const oldEvidence=applyConversationAnswer({draft,state,messages:[{role:'user',content:'nothing'},{role:'assistant',content:'What ticket category?'},{role:'user',content:'Adult tickets'}],answer:base});assert.ok(oldEvidence.conversationState.pendingFacts.some(f=>f.field==='ticketTiers'));
 const rejected=applyConversationAnswer({draft,state,messages:[{role:'assistant',content:'What disclaimer should guests see?'},{role:'user',content:'nothing'}],answer:{...base,patch:{...base.patch,ticketTiers:[{id:'unknown',price:'20'}]}}});assert.ok(rejected.conversationState.pendingFacts.some(f=>f.field==='ticketTiers'));assert.deepEqual(rejected.draft,draft);
});
test('Nothing cannot become a new category even when the model proposes it incorrectly',()=>{
 const draft=emptyListing(),state={version:1,pendingFacts:[{field:'ticketTiers',sourceText:'it should between them'}]},text='nothing';
 const answer={reply:'What ticket category would you like to add or change?',patch:{ticketTiers:[{id:'new-1',name:'Nothing',description:'',price:'10',quantity:'10'}]},sources:[{field:'ticketTiers',sourceText:text}],pending:[{field:'ticketTiers',sourceText:text,question:'What ticket category?'}]};
 const result=applyConversationAnswer({draft,state,messages:[{role:'assistant',content:'What ticket category would you like to add or change?'},{role:'user',content:text}],answer});assert.deepEqual(result.draft,draft);assert.deepEqual(result.conversationState.pendingFacts,[]);assert.match(result.reply,/stay as they are/);assert.doesNotMatch(result.reply,/What ticket category/);
});
test('a category decline cannot settle independent pending price or total capacity',()=>{
 const state={version:1,pendingFacts:[{field:'ticketTiers',sourceText:'Adult categories'},{field:'price',sourceText:'Set a new price'},{field:'capacity',sourceText:'A limit of 10'}]},text='nothing';
 const result=applyConversationAnswer({draft:emptyListing(),state,messages:[{role:'assistant',content:'What ticket category would you like to add or change?'},{role:'user',content:text}],answer:{reply:'What next?',patch:{resolveFields:['ticketTiers','price','capacity']},sources:['ticketTiers','price','capacity'].map(field=>({field,sourceText:text})),pending:[]}});assert.deepEqual(result.conversationState.pendingFacts,state.pendingFacts.slice(1));
});
test('accepted shared choice clears only pure stale pool confirmation, not unfinished category pricing',()=>{
 const draft=emptyListing(),state={version:1,pendingFacts:[{field:'ticketTiers',sourceText:'it should between them'},{field:'ticketTiers',sourceText:'Adult tickets need a new price'}]};
 const result=run({inventoryMode:'shared',capacity:'10'},'Shared between them',draft,state);assert.equal(result.draft.capacity,'10');assert.deepEqual(result.conversationState.pendingFacts,[state.pendingFacts[1]]);
});
