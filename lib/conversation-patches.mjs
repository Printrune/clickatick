import {randomUUID} from 'node:crypto';
import {parseListing} from './listing.mjs';
import {mergeAIDraft} from './setup.mjs';
import {CONVERSATION_FIELDS,parseConversationState} from './conversation-state.mjs';
const SETUP_FIELDS=['businessAddress','eventAddress','sameLocation','restrictions','disclaimer','refundPolicy','supportiveMessage','referralEnabled','referralPercentage','paymentPreferences','inventoryMode'];
const PATCH_FIELDS=CONVERSATION_FIELDS.filter(field=>field!=='details');
const CLEARABLE=['title','description','location','price','capacity','ticketFormat','ticketTiers','schedule','businessAddress','eventAddress','restrictions','disclaimer','refundPolicy','referralPercentage','paymentPreferences'];
const GROUPS=[['title'],['description'],['location'],['duration'],['ticketFormat'],['type','timezone','schedule'],['price','capacity','ticketTiers','inventoryMode'],['businessAddress','eventAddress','sameLocation'],['restrictions'],['disclaimer'],['refundPolicy'],['supportiveMessage'],['referralEnabled','referralPercentage'],['paymentPreferences']];
const QUESTIONS={title:'What title should I use?',type:'Is this an event or a recurring activity?',description:'How would you describe the event or activity?',location:'Where will the event or activity take place?',timezone:'Which time zone should I use?',price:'What ticket price should I use?',capacity:'How many tickets should be available in total?',duration:'How many minutes should each session last?',ticketFormat:'Should guests receive digital tickets, paper tickets, or both?',ticketTiers:'What ticket category would you like to add or change?',schedule:'What date should I use for the event or activity?',businessAddress:'What is the main business or attraction address?',eventAddress:'What is the event address?',sameLocation:'Is the event at the main business location?',restrictions:'What participation restrictions should guests know?',disclaimer:'What disclaimer would you like guests to see?',refundPolicy:'What refund policy would you like to include?',supportiveMessage:'Would you like to include the optional message supporting the organiser?',referralEnabled:'Would you like to offer referral rewards?',referralPercentage:'What referral percentage should come from your business share?',inventoryMode:'Should the total ticket limit be shared across all categories, or split into separate category allocations?',paymentPreferences:'Which digital payment methods would you like to request?',details:'What event or ticket detail would you like to work on next?'};
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const nonempty=value=>value!==undefined&&value!==null;
function schedulePatch(previous,patch){
 if(!object(patch))throw new Error('Invalid schedule proposal');
 const allowed=['kind','dates','start','until','time','weekdays'];
 if(Object.keys(patch).some(key=>!allowed.includes(key)))throw new Error('Invalid schedule proposal');
 const next={...previous};
 for(const key of allowed)if(nonempty(patch[key])){
  if((patch[key]===''&&previous[key]!==''&&previous[key]!=null)||(Array.isArray(patch[key])&&!patch[key].length&&previous[key]?.length))throw new Error('Use an explicit schedule clear');
  next[key]=patch[key];
 }
 if(patch.kind&&patch.kind!==previous.kind){
  if(patch.kind==='dates')Object.assign(next,{start:'',until:'',time:'',weekdays:[]});
  else if(patch.kind==='weekly')next.dates=[];
 }
 return next;
}
function tierPatch(previous,patch){
 if(!Array.isArray(patch)||patch.length>10)throw new Error('Invalid category proposal');
 const next=previous.map(tier=>({...tier})),seen=new Set();
 for(const entry of patch){
  if(!object(entry)||Object.keys(entry).some(key=>!['id','name','description','price','quantity'].includes(key)))throw new Error('Invalid category proposal');
  const id=entry.id;
  if(typeof id!=='string'||seen.has(id))throw new Error('Invalid category identity');seen.add(id);
  let at=next.findIndex(tier=>tier.id===id);
  if(at<0){if(id!==''&&!/^new-\d{1,2}$/.test(id))throw new Error('Unknown category identity');at=next.length;next.push({id:randomUUID(),name:'',description:'',price:'',quantity:''});}
  for(const key of ['name','description','price','quantity'])if(nonempty(entry[key])){if(typeof entry[key]==='string'&&entry[key].trim()===''&&next[at][key]!=='')throw new Error('Use an explicit category clear');next[at][key]=entry[key];}
 }
 return next;
}
function applyGroup(draft,patch,fields,clears){
 let candidate={...draft},setupPatch={};
 for(const field of fields){
  if(clears.has(field)){
   if(field==='schedule')candidate.schedule={kind:'dates',dates:[],start:'',until:'',time:'',weekdays:[]};
   else if(field==='ticketTiers')candidate.ticketTiers=[];
   else if(SETUP_FIELDS.includes(field))setupPatch[field]=field==='paymentPreferences'?[]:'';
   else candidate[field]='';
  }else if(nonempty(patch[field])){
   const value=patch[field];
   if(typeof value==='string'&&value.trim()===''&&typeof draft[field]==='string'&&draft[field]!=='')throw new Error('Use an explicit clear');
   if(SETUP_FIELDS.includes(field)){if(typeof value==='string'&&!value.trim())throw new Error('Use an explicit clear');if(field==='paymentPreferences'&&Array.isArray(value)&&!value.length&&draft.setup.paymentPreferences.length)throw new Error('Use an explicit clear');setupPatch[field]=value;}
   else if(field==='schedule')candidate.schedule=schedulePatch(draft.schedule,value);
   else if(field==='ticketTiers')candidate.ticketTiers=tierPatch(draft.ticketTiers,value);
   else candidate[field]=value;
  }
 }
 if(Object.keys(setupPatch).length)candidate=mergeAIDraft(draft,{...candidate,setupPatch});
 return parseListing(candidate);
}
function explicitClear(field,text){
 if(/\b(?:not|never|keep|don.t|do not|avoid)\b/i.test(text))return false;
 if(!/^(?:please\s+)?(?:clear|remove|delete|reset|take out)\b/i.test(text.trim()))return false;
 const labels={ticketTiers:'ticket (?:types|categories|tiers)',schedule:'(?:schedule|dates|times)',businessAddress:'(?:business|attraction) address',eventAddress:'event address',ticketFormat:'ticket (?:format|delivery)',referralPercentage:'referral (?:percentage|percent|reward)',paymentPreferences:'payment (?:methods|preferences)',refundPolicy:'refund policy'};
 const label=labels[field]||field.replace(/([A-Z])/g,' $1');
 return new RegExp('\\b(?:'+label+')\\b','i').test(text);
}
function explicitDecline(text){
 const clean=text.trim().replace(/[.,!?]/g,' ').replace(/\s+/g,' ').trim();
 return /^(?:nothing(?: else)?|none|no(?: more)? changes?|keep (?:them|it|everything|(?:the )?(?:categories|ticket categories|ticket types|tickets|prices|quantities)) (?:as is|as they are|unchanged)|(?:do not|don't) change(?: (?:them|it|anything|the categories|the ticket categories|the ticket types|the prices|the quantities))?)(?: please| thanks)?$/i.test(clean);
}
function resolutionScope(field,messages,latest){
 const preceding=messages.at(-2),question=preceding?.role==='assistant'?preceding.content:'';
 const labels={ticketTiers:'ticket categor(?:y|ies)|ticket types|concessions',capacity:'total|limit|capacity|quantity|quantities|how many|spots',price:'price|cost|charge|how much',inventoryMode:'shared|allocat(?:ed|ions?)|split|between',schedule:'date|time|year|schedule',ticketFormat:'ticket format|digital|paper',businessAddress:'business address|attraction address',eventAddress:'event address',sameLocation:'same (?:place|location)|business location',referralPercentage:'referral|reward',referralEnabled:'referral|reward',paymentPreferences:'payment',supportiveMessage:'support|message'};
 const label=labels[field]||field.replace(/([A-Z])/g,' $1');
 return new RegExp('\\b(?:'+label+')\\b','i').test(question+' '+latest);
}
function sharedPoolFact(text){
 const clean=text.trim().replace(/[.,!?]/g,' ').replace(/\s+/g,' ').trim();
 return /^(?:(?:it|they|that|the limit|the total) (?:should be|should|is|are|will be) )?(?:shared|between them|shared between them|shared across both|one total|one shared total|across both)$/i.test(clean);
}
function question(field,state,messages){
 if(field==='ticketTiers'&&state.pendingFacts.some(f=>f.field==='capacity'||f.field==='inventoryMode'))return QUESTIONS.inventoryMode;
 if(field!=='schedule')return QUESTIONS[field]||QUESTIONS.details;
 const userAnswers=messages.flatMap((message,index)=>message.role==='user'?[{text:message.content.trim(),question:messages[index-1]?.role==='assistant'?messages[index-1].content:''}]:[]);
 const calendarYear=text=>/\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Halloween|Christmas)\b[^.!?]{0,35}\b(?:19|20|21)\d{2}\b|\b(?:19|20|21)\d{2}-\d{2}-\d{2}\b|\bthis year\b/i.test(text);
 const year=userAnswers.some(({text,question})=>calendarYear(text)||(/\byear\b/i.test(question)&&/^(?:(?:in|for) )?(?:19|20|21)\d{2}[.!]?$/i.test(text)))||state.pendingFacts.some(f=>f.field==='schedule'&&(calendarYear(f.sourceText)||/^(?:(?:in|for) )?(?:19|20|21)\d{2}[.!]?$/i.test(f.sourceText)));
 if(!year)return 'Which year should I use for that date?';
 const time=userAnswers.some(({text,question})=>/\b(?:time|when.*start)\b/i.test(question)&&/^(?:at )?(?:\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)|(?:[01]\d|2[0-3]):[0-5]\d)[.!]?$/i.test(text));
 const pendingTime=state.pendingFacts.some(f=>f.field==='schedule'&&/^(?:at )?(?:\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)|(?:[01]\d|2[0-3]):[0-5]\d)[.!]?$/i.test(f.sourceText));
 return time||pendingTime?'What exact date should I use for the event or activity?':'What time should the event or activity start?';
}
function addFact(facts,field,sourceText){
 const text=sourceText.trim();
 for(let offset=0;offset<text.length;){let end=Math.min(offset+500,text.length);if(end<text.length&&/[\uD800-\uDBFF]/.test(text[end-1]))end--;const part=text.slice(offset,end);if(!facts.some(f=>f.field===field&&f.sourceText===part))facts.push({field,sourceText:part});offset=end;}
}
function valueAt(draft,field){
 const setup=draft.setup;
 if(field==='businessAddress')return setup.business.address;
 if(field==='eventAddress')return setup.eventLocation.address;
 if(field==='referralEnabled')return setup.referrals.enabled;
 if(field==='referralPercentage')return setup.referrals.percentage;
 return SETUP_FIELDS.includes(field)?setup[field]:draft[field];
}
function meaningful(value){return object(value)?Object.values(value).some(nonempty):Array.isArray(value)?value.length>0:nonempty(value);}
function represented(field,value,next){
 if(field==='ticketTiers')return true;
 const actual=valueAt(next,field);
 if(['price','capacity'].includes(field)&&typeof value==='string'&&/^\d+(?:\.\d{1,2})?$/.test(value)&&actual!=='')return Number(value)===Number(actual);
 if(object(value))return Object.entries(value).every(([key,item])=>!nonempty(item)||same(item,actual?.[key]));
 return same(typeof value==='string'?value.trim():value,actual);
}
/** Apply only grounded provider changes. Invalid proposals are clarification turns. */
export function applyConversationAnswer({draft,state,messages,answer}){
 const original=state,latest=messages.filter(message=>message.role==='user').at(-1)?.content||'';
 const evidence=[latest,...state.pendingFacts.map(f=>f.sourceText)];
 const grounded=text=>typeof text==='string'&&text.trim()&&text.length<=500&&evidence.some(source=>source.includes(text));
 const sources=object(answer)&&Array.isArray(answer.sources)?answer.sources:[];
 const sourceFor=field=>sources.find(item=>object(item)&&item.field===field&&grounded(item.sourceText))?.sourceText;
 const patch=object(answer)&&object(answer.patch)?{...answer.patch}:{};
 // The organiser's explicit no-change answer outranks a contradictory model edit.
 const declined=new Set(explicitDecline(latest)?PATCH_FIELDS.filter(field=>resolutionScope(field,messages,latest)):[]);
 for(const field of declined)delete patch[field];
 if(Array.isArray(patch.clearFields))patch.clearFields=patch.clearFields.filter(field=>!declined.has(field));
 const requested=PATCH_FIELDS.filter(field=>nonempty(patch[field]));
 const bad=new Set(),blocked=new Set(),applied=new Set(),pending=[];
 const clears=new Set();
 if(patch.clearFields!==undefined&&!Array.isArray(patch.clearFields))bad.add('details');
 if(Array.isArray(patch.clearFields))for(const field of patch.clearFields){if(CLEARABLE.includes(field)&&sourceFor(field)&&explicitClear(field,sourceFor(field)))clears.add(field);else bad.add(PATCH_FIELDS.includes(field)?field:'details');}
 if(Object.keys(patch).some(field=>!PATCH_FIELDS.includes(field)&&field!=='clearFields'&&field!=='resolveFields'))bad.add('details');
 if(!object(answer)||!object(answer.patch))bad.add('details');
 for(const field of [...requested,...clears])if(!sourceFor(field))bad.add(field);
 let accepted=draft;
 const groups=(!draft.ticketTiers.length&&!nonempty(patch.ticketTiers))?GROUPS.flatMap(fields=>fields.includes('ticketTiers')?[['price'],['capacity','inventoryMode'],['ticketTiers']]:[fields]):GROUPS;
 for(const fields of groups){
  const relevant=fields.filter(field=>requested.includes(field)||clears.has(field));if(!relevant.length)continue;
  if(relevant.some(field=>bad.has(field))){for(const field of relevant)if(!bad.has(field))blocked.add(field);continue;}
  try{
   const next=applyGroup(accepted,patch,relevant,clears);
   const clearValue=field=>field==='schedule'?{kind:'dates',dates:[],start:'',until:'',time:'',weekdays:[]}:['ticketTiers','paymentPreferences'].includes(field)?[]:'';
   const ignored=relevant.filter(field=>!represented(field,clears.has(field)?clearValue(field):patch[field],next));
   if(ignored.length){for(const field of ignored)bad.add((field==='price'||field==='capacity')&&accepted.ticketTiers.length?'ticketTiers':field==='location'&&accepted.setup[accepted.setup.sameLocation?'business':'eventLocation'].address?(accepted.setup.sameLocation?'businessAddress':'eventAddress'):field);for(const field of relevant)blocked.add(field);continue;}
   for(const field of relevant)if(clears.has(field)||meaningful(patch[field]))applied.add(field);
   accepted=next;
  }
  catch{
   const invalid=relevant.filter(field=>{try{applyGroup(accepted,patch,[field],clears);return false;}catch{return true;}});
   for(const field of invalid.length?invalid:relevant)bad.add(field);
   for(const field of relevant)if(!bad.has(field))blocked.add(field);
  }
 }
 // Explicitly declining an unfinished topic settles context, never draft data.
 const resolved=new Set();
 const resolutionRequests=new Set([...(Array.isArray(patch.resolveFields)?patch.resolveFields:[]),...declined]);
 for(const field of resolutionRequests){
  if(!CONVERSATION_FIELDS.includes(field)||!state.pendingFacts.some(fact=>fact.field===field)||bad.has(field)||blocked.has(field))continue;
  const source=sources.find(item=>object(item)&&item.field===field&&typeof item.sourceText==='string'&&item.sourceText.trim()&&latest.includes(item.sourceText));
  if((source||declined.has(field))&&explicitDecline(latest)&&resolutionScope(field,messages,latest))resolved.add(field);
 }
 // Only accepted groups or explicit scoped declines can resolve old facts.
 const completedPoolFact=fact=>applied.has('inventoryMode')&&accepted.setup.inventoryMode==='shared'&&fact.field==='ticketTiers'&&sharedPoolFact(fact.sourceText);
 const facts=state.pendingFacts.filter(fact=>!applied.has(fact.field)&&!resolved.has(fact.field)&&!completedPoolFact(fact)).map(fact=>({...fact}));
 if(Array.isArray(answer?.pending))for(const item of answer.pending){
  if(object(item)&&(resolved.has(item.field)||declined.has(item.field)))continue;
  if(object(item)&&CONVERSATION_FIELDS.includes(item.field)&&grounded(item.sourceText)){pending.push(item.field);addFact(facts,item.field,item.sourceText);}
  else bad.add('details');
 }
 for(const field of [...bad,...blocked])addFact(facts,field,sourceFor(field)||latest);
 const hasQuestion=messages.at(-2)?.role==='assistant';
 const carryField=state.pendingFacts.find(fact=>!applied.has(fact.field)&&!resolved.has(fact.field)&&!completedPoolFact(fact)&&(resolutionScope(fact.field,messages,latest)||(!hasQuestion&&!requested.length&&!clears.size&&!resolved.size)));
 if(carryField)addFact(facts,carryField.field,latest);

 let conversationState;
 try{conversationState=parseConversationState({version:1,pendingFacts:facts});}
 catch{return {draft,conversationState:original,reply:'There are several unfinished details. Your latest answer is still in this chat, but is not saved yet. '+question(original.pendingFacts[0]?.field||'details',original,messages)};}
 const focus=[...bad,...pending][0];
 const pendingQuestion=!bad.size&&Array.isArray(answer?.pending)?answer.pending.find(item=>item.field===focus&&typeof item.question==='string'&&item.question.length<=300&&/^(?:what|where|when|which|how|would|should|is|are|do|does|can)\b/i.test(item.question.trim())&&item.question.trim().endsWith('?'))?.question.trim():null;
 const validReply=typeof answer?.reply==='string'&&answer.reply.trim()&&answer.reply.length<=3000;
 let reply=focus?(pendingQuestion||question(focus,conversationState,messages)):declined.has('ticketTiers')?'Your ticket categories will stay as they are. Would you like to review your draft?':validReply?answer.reply.trim():null;
 if(!reply){addFact(facts,'details',latest);try{conversationState=parseConversationState({version:1,pendingFacts:facts});}catch{conversationState=original;}reply=QUESTIONS.details;}
 return {draft:accepted,conversationState,reply};
}
