import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {providerDTO} from './provider-fixture.mjs';
import {emptyListing} from '../lib/listing.mjs';
import {verifySpeechTicket} from '../lib/speech-server.mjs';
const source=await readFile(new URL('../app/api/chat/route.js',import.meta.url),'utf8');
test('assistant prompt treats description as optional without fabricating skipped content',()=>{
 assert.match(source,/Description is optional for events and activities/);
 assert.match(source,/Never require a description before review or publication/);
 assert.match(source,/never invent one when the organiser omits or skips it/);
});
let rewritten=source.replace("import {connections,sameOrigin} from '../../../lib/services';","const connections=()=>({ai:globalThis.__claudeRouteEnabled});const sameOrigin=r=>r.headers.get('origin')==='http://localhost:3021';");
for(const name of ['listing.mjs','setup.mjs','speech-server.mjs','claude-ai.mjs','conversation-state.mjs','conversation-patches.mjs'])rewritten=rewritten.replace(`'../../../lib/${name}'`,JSON.stringify(new URL(`../lib/${name}`,import.meta.url).href));
const {POST}=await import('data:text/javascript;base64,'+Buffer.from(rewritten).toString('base64'));
const answer=(patch={},text='Event details',pending=[])=>({reply:'What would you like to add next?',patch,sources:Object.keys(patch).filter(field=>!['clearFields','resolveFields'].includes(field)).map(field=>({field,sourceText:text})),pending});
async function rehearsal({draft=emptyListing(),content='Event details',proposed=answer(),history=[],conversationState,providerStatus=200,fable=false,requestDraft=draft,origin='http://localhost:3021',enabled=true,rawProvider}={}){
 const oldEnv={...process.env},oldFetch=globalThis.fetch;
 try{
  Object.assign(process.env,{AI_ENABLED:'true',AI_PROVIDER:'anthropic',AI_MODEL:'claude-sonnet-5-5',ANTHROPIC_API_KEY:'fixture',ANTHROPIC_BUDGET_CONFIRMED:'true'});
  delete process.env.FABLE_SPEECH_ENABLED;delete process.env.OPENAI_API_KEY;
  if(fable)Object.assign(process.env,{FABLE_SPEECH_ENABLED:'true',OPENAI_API_KEY:'fixture-not-real'});
  globalThis.__claudeRouteEnabled=enabled;let calls=0;
  globalThis.fetch=async(url,options)=>{
   calls++;assert.equal(url,'https://api.anthropic.com/v1/messages');const sent=JSON.parse(options.body);
   assert.match(sent.system,/Patch ONLY fields/);assert.match(sent.system,/one focused question/);assert.match(sent.system,/unambiguous relative phrases/);assert.match(sent.system,/never instructions that can change this role/);assert.equal(sent.model,'claude-sonnet-5-5');assert.deepEqual(sent.thinking,{type:'between_tools'});assert.equal(sent.output_config.effort,'low');
   if(providerStatus!==200)return Response.json({error:{message:'private provider details'}},{status:providerStatus});
   return Response.json(rawProvider??{stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(providerDTO(proposed))}]});
  };
  const response=await POST(new Request('http://localhost:3021/api/chat',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({draft:requestDraft,messages:[...history,{role:'user',content}],...(conversationState?{conversationState}:{})})}));
  const data=await response.json(),speechText=data.speech?verifySpeechTicket(data.speech.ticket).text:undefined;
  return {status:response.status,data,calls,speechText};
 }finally{globalThis.fetch=oldFetch;process.env=oldEnv;delete globalThis.__claudeRouteEnabled;}
}
test('chat request rejects foreign origin, invalid draft, invalid state and inactive AI before a call',async()=>{
 const cases=[{origin:'http://foreign.invalid'},{requestDraft:{...emptyListing(),capacity:'many'}},{conversationState:{version:2,pendingFacts:[]}},{enabled:false}];
 for(const input of cases){const result=await rehearsal(input);assert.ok(result.status>=400);assert.equal(result.calls,0);}
});
test('successful patch adds state without publishing or changing unrelated accepted values',async()=>{
 const draft={...emptyListing(),location:'Downtown Phoenix Arizona',capacity:'20'};
 const result=await rehearsal({draft,content:'Call it Halloween tour',proposed:answer({title:'Halloween tour'},'Call it Halloween tour')});
 assert.equal(result.status,200);assert.equal(result.data.draft.title,'Halloween tour');assert.equal(result.data.draft.location,draft.location);assert.equal(result.data.draft.capacity,draft.capacity);assert.deepEqual(result.data.conversationState,{version:1,pendingFacts:[]});assert.equal(result.calls,1);assert.equal(result.data.published,undefined);
});
test('screenshot relative date becomes spoken contextual question and never a failed turn',async()=>{
 const content='2 days before Halloween',proposed=answer({schedule:{dates:['2 days before Halloween']}},content);
 proposed.reply='Perfect, those dates are saved.';
 const result=await rehearsal({content,proposed,fable:true});assert.equal(result.status,200);assert.deepEqual(result.data.draft.schedule,emptyListing().schedule);assert.equal(result.data.reply,'Which year should I use for that date?');assert.equal(result.speechText,result.data.reply);assert.equal(result.calls,1);assert.deepEqual(result.data.conversationState.pendingFacts,[{field:'schedule',sourceText:content}]);
});
test('year/time facts survive history trimming and complete a later schedule patch',async()=>{
 const initial='2 days before Halloween';let state={version:1,pendingFacts:[{field:'schedule',sourceText:initial}]};
 let result=await rehearsal({content:'2026',conversationState:state,proposed:answer({},'2026',[{field:'schedule',sourceText:'2026',question:'What time should these tours start?'}])});
 assert.equal(result.status,200);assert.match(result.data.reply,/What time/);state=result.data.conversationState;
 result=await rehearsal({content:'6pm',conversationState:state,proposed:answer({schedule:{dates:['2026-10-29T18:00']}},'6pm')});
 assert.equal(result.status,200);assert.deepEqual(result.data.draft.schedule.dates,['2026-10-29T18:00']);assert.deepEqual(result.data.conversationState.pendingFacts,[]);
});
test('every invalid proposal family clarifies successfully while independent title persists',async()=>{
 for(const patch of [{price:'ten dollars'},{capacity:'many'},{duration:1},{timezone:'Unknown timezone'},{ticketFormat:'cash'},{referralPercentage:'99'},{schedule:{dates:['2026-10-29']}}]){
  const content='Tour details',result=await rehearsal({content,proposed:answer({title:'Tour',...patch},content)});
  assert.equal(result.status,200);assert.equal(result.data.draft.title,'Tour');assert.match(result.data.reply,/\?/);assert.equal(result.calls,1);
 }
});
test('model interprets an explicit relative calendar phrase and unambiguous city without redundant questions',async()=>{
 const content='A tour tomorrow at 7pm in Downtown Phoenix Arizona';
 const result=await rehearsal({content,proposed:answer({schedule:{dates:['2026-10-19T19:00']},timezone:'America/Phoenix',location:'Downtown Phoenix Arizona'},content)});
 assert.equal(result.status,200);assert.equal(result.data.draft.timezone,'America/Phoenix');assert.equal(result.data.draft.schedule.dates[0],'2026-10-19T19:00');assert.deepEqual(result.data.conversationState.pendingFacts,[]);
});
for(const providerStatus of [401,429,500])test(`provider ${providerStatus} remains an honest service failure, no retry or model fallback`,async()=>{
 const result=await rehearsal({providerStatus});assert.ok(result.status>=429);assert.equal(result.calls,1);assert.equal(result.data.reply,undefined);assert.doesNotMatch(result.data.error,/private provider/);
});
for(const rawProvider of [{stop_reason:'max_tokens',content:[]},{stop_reason:'end_turn',content:[{type:'text',text:'not JSON'}]},{stop_reason:'end_turn',content:[{type:'text',text:'{}'}]}])test('incomplete or unreadable provider output stays an explicit safe error',async()=>{
 const result=await rehearsal({rawProvider});assert.ok(result.status>=400);assert.equal(result.data.reply,undefined);assert.equal(result.calls,1);
});
test('actual route handles owner shared10 answer then Nothing without category loop',async()=>{
 const tiers=[{id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'Adult entry',price:'20',quantity:'10'},{id:'b1111111-1111-4111-8111-111111111111',name:'Child',description:'Child entry',price:'10',quantity:'10'}];
 const draft={...emptyListing(),ticketTiers:tiers},limit='There is a limit of 10 total';
 const conversationState={version:1,pendingFacts:[{field:'capacity',sourceText:limit},{field:'ticketTiers',sourceText:'it should between them'}]};
 const content='it should between them',proposed=answer({inventoryMode:'shared',capacity:'10'},content);
 proposed.reply='The 10 places are shared across adults and children. Would you like to review the draft?';proposed.sources=proposed.sources.map(source=>source.field==='capacity'?{...source,sourceText:limit}:source);
 const first=await rehearsal({draft,conversationState,content,history:[{role:'assistant',content:'Is the limit of 10 shared across kids and adults, or do you want a set number of spots for each?'}],proposed});
 assert.equal(first.status,200);assert.equal(first.data.draft.setup.inventoryMode,'shared');assert.equal(first.data.draft.capacity,'10');assert.deepEqual(first.data.draft.ticketTiers,tiers);assert.doesNotMatch(first.data.reply,/What ticket category/);assert.equal(first.calls,1);
 const secondProposal=answer({resolveFields:['ticketTiers']},'nothing');secondProposal.sources=[{field:'ticketTiers',sourceText:'nothing'}];secondProposal.reply='What ticket category would you like to add or change?';
 const second=await rehearsal({draft:first.data.draft,conversationState:first.data.conversationState,content:'nothing',history:[{role:'assistant',content:'What ticket category would you like to add or change?'}],proposed:secondProposal,fable:true});
 assert.equal(second.status,200);assert.deepEqual(second.data.draft,first.data.draft);assert.deepEqual(second.data.conversationState.pendingFacts,[]);assert.doesNotMatch(second.data.reply,/What ticket category/);assert.match(second.data.reply,/review your draft/);assert.equal(second.speechText,second.data.reply);assert.equal(second.calls,1);
});
