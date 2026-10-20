export const CLAUDE_MODEL='claude-sonnet-5-5';
export const CLAUDE_MODELS=['claude-haiku-4-5-20251001',CLAUDE_MODEL];
export class ClaudeError extends Error {
  constructor(message,status=502,code='unavailable',upstreamStatus){super(message);this.status=status;this.code=code;this.upstreamStatus=upstreamStatus;}
}
// Provider text is used only for classification. Never return or log its contents.
export function classifyClaudeError(status,body){
  const type=typeof body?.error?.type==='string'?body.error.type:'';
  const message=typeof body?.error?.message==='string'?body.error.message.toLowerCase():'';
  let code='unavailable',text='The listing agent is unavailable. Please try again.',http=502;
  if(status===401||type==='authentication_error'){code='authentication';text='The Claude API key was rejected. Check the saved server key.';http=503;}
  else if(status===400&&(/x-api-key|api.key/.test(message)||(/key/.test(message)&&/header/.test(message)))){code='credential_configuration';text='Claude rejected the API key header. Save only the Anthropic Console API key, without quotes or a variable name.';http=503;}
  else if(status===403||type==='permission_error'){code='permission';text='The Claude API account does not permit this request.';http=503;}
  else if(status===429||type==='rate_limit_error'){code='rate_limit';text='The Claude request limit was reached. Please wait before trying again.';http=429;}
  else if(status===400&&/spend|spending|usage/.test(message)&&/limit|cap|exceed/.test(message)){code='spend_limit';text='The Claude account spending limit was reached. Requests must remain within the approved allowance.';http=503;}
  else if(status===402||([400,404].includes(status)&&/credit balance|insufficient credits|insufficient balance|billing|payment required/.test(message))){code='low_credits';text='Claude reports insufficient API credits. Check the API account balance without enabling automatic refills.';http=503;}
  else if([400,404].includes(status)&&/model/.test(message)&&/not found|not available|does not exist|access|unsupported|not supported|invalid model/.test(message)){code='model_unavailable';text='The Claude account cannot use the configured model. The connection needs a model access check.';http=503;}
  else if(status===400&&/schema|output_config|output_format|structured.output/.test(message)){code='invalid_schema';text='Claude rejected the listing response format. The integration needs a format compatibility check.';http=503;}
  else if(status===400&&/oauth|authentication/.test(message)&&/not supported|unsupported|invalid/.test(message)){code='unsupported_authentication';text='Claude rejected the credential type. Use an Anthropic Console API key, not a subscription login token.';http=503;}
  else if(status===400&&/organi[sz]ation|account/.test(message)&&/verif|disabled|suspend|deactivat|not enabled/.test(message)){code='account_verification';text='Claude requires an API account verification or account status check.';http=503;}
  else if(status===400&&/country|region|location/.test(message)&&/unsupported|not supported|restrict|unavailable/.test(message)){code='region_unavailable';text='Claude does not permit API access from this service region.';http=503;}
  else if(status===400&&/model/.test(message)&&/retir|deprecat/.test(message)){code='model_retired';text='The configured Claude model has been retired. The connection needs an updated model.';http=503;}
  else if(status===400&&/max_tokens|token limit|prompt is too long|context window/.test(message)){code='token_limit';text='Claude rejected the conversation token limit. The integration needs a request size check.';http=503;}
  else if(status===400&&/messages|message content|roles|first message|assistant message|user message/.test(message)){code='invalid_messages';text='Claude rejected the conversation message sequence. The integration needs a conversation format check.';http=503;}
  else if(status===400||type==='invalid_request_error'){
    code='invalid_request';text='Claude rejected the request format. The integration needs a request compatibility check.';http=503;
    // Emit only a fixed vocabulary, not provider excerpts (which can echo user data).
    const terms=['credit','balance','billing','quota','usage','limit','organization','account','verify','verification','oauth','subscription','key','model','retired','deprecated','country','region','messages','role','content','system','header','headers','version','tokens','max_tokens','output_config','format','schema','disabled','permission','unsupported','invalid','required','missing'];
    const matched=terms.filter(term=>new RegExp(`\\b${term}\\b`).test(message));
    if(matched.length)text+=` Diagnostic: ${matched.join(', ')}.`;
  }
  else if(status===413||type==='request_too_large'){code='request_too_large';text='The conversation exceeds the Claude request size limit. Please shorten it.';http=413;}
  else if(status===529||type==='overloaded_error'){code='overloaded';text='Claude is temporarily busy. Please try again later.';}
  return new ClaudeError(`${text} Your draft is safe.`,http,code,status);
}
export function claudeReady(env=process.env){
  return env.AI_ENABLED==='true'&&env.AI_PROVIDER==='anthropic'&&env.ANTHROPIC_BUDGET_CONFIRMED==='true'&&Boolean(env.ANTHROPIC_API_KEY?.trim())&&(!env.AI_MODEL||CLAUDE_MODELS.includes(env.AI_MODEL));
}
const string={type:'string'};
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const array=items=>({type:'array',items});
const nullable=type=>({type:[type,'null']});
const fieldNames=['title','type','description','location','timezone','price','capacity','duration','ticketFormat','ticketTiers','schedule','businessAddress','eventAddress','sameLocation','restrictions','disclaimer','refundPolicy','supportiveMessage','referralEnabled','referralPercentage','inventoryMode','paymentPreferences','details'];
const nullOr=schema=>({anyOf:[schema,{type:'null'}]});
export const PATCH_TEXT_FIELDS=['title','type','description','location','timezone','price','capacity','ticketFormat','businessAddress','eventAddress','restrictions','disclaimer','refundPolicy','referralPercentage','inventoryMode'];
export const PATCH_FLAG_FIELDS=['sameLocation','supportiveMessage','referralEnabled'];
export const answerSchema=object({reply:string,patch:object({
 text:array(object({field:{type:'string',enum:PATCH_TEXT_FIELDS},value:string})),
 flags:array(object({field:{type:'string',enum:PATCH_FLAG_FIELDS},value:{type:'boolean'}})),
 duration:nullable('integer'),
 ticketTiers:nullOr(array(object({id:{...string,description:'Existing category ID, or new-1/new-2 for new categories. Never generate UUIDs.'},name:nullable('string'),description:nullable('string'),price:nullable('string'),quantity:nullable('string')}))),
 schedule:nullOr(object({kind:nullOr({type:'string',enum:['dates','weekly']}),dates:nullOr(array({...string,description:'Complete confirmed local YYYY-MM-DDTHH:mm only. Never invent year or time.'})),start:nullable('string'),until:nullable('string'),time:nullable('string'),weekdays:nullOr(array({type:'integer'}))})),
 paymentPreferences:nullOr(array({type:'string',enum:['card','bank-transfer','digital-wallet','bitcoin','crypto','epay']})),clearFields:array({type:'string',enum:fieldNames.filter(field=>field!=='details')}),resolveFields:array({type:'string',enum:fieldNames})
 }),sources:array(object({field:{type:'string',enum:fieldNames},sourceText:{...string,description:'Exact excerpt of latest user message or retained pending fact, at most500 characters.'}})),pending:array(object({field:{type:'string',enum:fieldNames},sourceText:{...string,description:'Exact unresolved user words, at most500 characters.'},question:{...string,description:'One focused question for the missing fact. No saved claims.'}}))});
/** Count every parameter occurrence, including reused and nested descriptors. */
export function schemaComplexity(schema){
 let unions=0,optional=0;
 function visit(value,ancestors=new Set()){
  if(!value||typeof value!=='object')return;
  if(ancestors.has(value))throw new ClaudeError('The listing response schema is not valid.',503,'invalid_schema');
  const next=new Set(ancestors);next.add(value);
  if(!Array.isArray(value)){
   if((Array.isArray(value.type)&&value.type.length>1)||Array.isArray(value.anyOf)||Array.isArray(value.oneOf))unions++;
   if(value.properties&&typeof value.properties==='object')optional+=Object.keys(value.properties).filter(key=>!Array.isArray(value.required)||!value.required.includes(key)).length;
  }
  for(const item of Object.values(value))visit(item,next);
 }
 visit(schema);return {unions,optional};
}
export function assertSchemaComplexity(schema){
 const result=schemaComplexity(schema);
 if(result.unions>16||result.optional>24)throw new ClaudeError('The listing response format exceeds the provider schema limits. Your draft is safe.',503,'invalid_schema');
 return result;
}
const canonical=(value,choices)=>typeof value==='string'?choices.find(choice=>choice.toLowerCase()===value.toLowerCase()):undefined;
const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value,keys)=>record(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
/** Translate the provider-only compact DTO once at the network boundary. */
export function decodeProviderAnswer(value){
 const malformed=()=>{throw new ClaudeError('The agent response format was incomplete. Your draft is safe. Please try again.',502,'invalid_response');};
 if(!exact(value,['reply','patch','sources','pending'])||typeof value.reply!=='string'||!value.reply.trim()||value.reply.length>3000||!exact(value.patch,['text','flags','duration','ticketTiers','schedule','paymentPreferences','clearFields','resolveFields']))malformed();
 const dto=value.patch,patch={},seen=new Set();
 if(!Array.isArray(dto.text)||!Array.isArray(dto.flags)||!Array.isArray(dto.clearFields)||!Array.isArray(dto.resolveFields))malformed();
 for(const [entries,fields,type]of [[dto.text,PATCH_TEXT_FIELDS,'string'],[dto.flags,PATCH_FLAG_FIELDS,'boolean']]){
  for(const entry of entries){
   const field=canonical(entry?.field,fields);
   if(!exact(entry,['field','value'])||!field||typeof entry.value!==type||seen.has(field))malformed();
   seen.add(field);
   const choices=field==='type'?['event','activity']:field==='ticketFormat'?['digital','paper','both']:field==='inventoryMode'?['shared','allocated']:null;
   patch[field]=choices?(canonical(entry.value,choices)||entry.value):entry.value;
  }
 }
 if(dto.duration!==null&&!Number.isInteger(dto.duration))malformed();
 if(dto.ticketTiers!==null){
  if(!Array.isArray(dto.ticketTiers)||dto.ticketTiers.some(tier=>!exact(tier,['id','name','description','price','quantity'])||typeof tier.id!=='string'||['name','description','price','quantity'].some(key=>tier[key]!==null&&typeof tier[key]!=='string')))malformed();
 }
 if(dto.schedule!==null){
  const schedule=dto.schedule;
  if(!exact(schedule,['kind','dates','start','until','time','weekdays'])||schedule.kind!==null&&!canonical(schedule.kind,['dates','weekly'])||['start','until','time'].some(key=>schedule[key]!==null&&typeof schedule[key]!=='string')||schedule.dates!==null&&(!Array.isArray(schedule.dates)||schedule.dates.some(date=>typeof date!=='string'))||schedule.weekdays!==null&&(!Array.isArray(schedule.weekdays)||schedule.weekdays.some(day=>!Number.isInteger(day))))malformed();
 }
 if(dto.paymentPreferences!==null&&(!Array.isArray(dto.paymentPreferences)||dto.paymentPreferences.some(method=>!canonical(method,['card','bank-transfer','digital-wallet','bitcoin','crypto','epay']))))malformed();
 if(dto.clearFields.some(field=>!canonical(field,fieldNames)||canonical(field,fieldNames)==='details'))malformed();
 for(const key of ['duration','ticketTiers','schedule','paymentPreferences'])if(dto[key]!==null)patch[key]=dto[key];
 if(patch.schedule)patch.schedule={...patch.schedule,...(patch.schedule.kind!==null?{kind:canonical(patch.schedule.kind,['dates','weekly'])}:{})};
 if(patch.paymentPreferences)patch.paymentPreferences=patch.paymentPreferences.map(method=>canonical(method,['card','bank-transfer','digital-wallet','bitcoin','crypto','epay']));
 patch.clearFields=dto.clearFields.map(field=>canonical(field,fieldNames));
 if(dto.resolveFields.some(field=>!canonical(field,fieldNames)))malformed();
 patch.resolveFields=dto.resolveFields.map(field=>canonical(field,fieldNames));
 if(!Array.isArray(value.sources)||!Array.isArray(value.pending))malformed();
 if(value.sources.some(source=>!exact(source,['field','sourceText'])||!canonical(source.field,fieldNames)||typeof source.sourceText!=='string'))malformed();
 if(value.pending.some(item=>!exact(item,['field','sourceText','question'])||!canonical(item.field,fieldNames)||typeof item.sourceText!=='string'||typeof item.question!=='string'))malformed();
 return {reply:value.reply,patch,sources:value.sources.map(source=>({...source,field:canonical(source.field,fieldNames)})),pending:value.pending.map(item=>({...item,field:canonical(item.field,fieldNames)}))};
}
export async function claudeCompletion({system,messages},env=process.env,fetcher=fetch){
  if(!claudeReady(env))throw new ClaudeError('The listing agent is not connected within its approved spending limit yet.',503);
  const apiKey=env.ANTHROPIC_API_KEY.trim();
  if(!/^[A-Za-z0-9_-]+$/.test(apiKey)||/^(bearer\b|anthropic_api_key\b)/i.test(apiKey))throw new ClaudeError('The saved Claude API key has an invalid format. Save only the key, without quotes, spaces, or a variable name.',503,'credential_configuration');
  assertSchemaComplexity(answerSchema);
  const model=env.AI_MODEL||CLAUDE_MODEL;
  const modern=model===CLAUDE_MODEL;
  const payload=JSON.stringify({model,max_tokens:1800,system,messages,...(modern?{thinking:{type:'between_tools'}}:{}),output_config:{...(modern?{effort:'low'}:{}),format:{type:'json_schema',schema:answerSchema}}});
  if(Buffer.byteLength(payload)>40000)throw new ClaudeError('This conversation is too long. Please shorten it.',413);
  let response;
  try{response=await fetcher('https://api.anthropic.com/v1/messages',{method:'POST',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(45000),headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','Content-Type':'application/json'},body:payload});}
  catch{throw new ClaudeError('The listing agent could not connect. Your draft is safe. Please try again.');}
  if(!response.ok){
    let body;
    try{body=await response.json();}catch{}
    throw classifyClaudeError(response.status,body);
  }
  let result;
  try{result=await response.json();}catch{throw new ClaudeError('The agent response could not be read. Your draft is safe.');}
  if(result.stop_reason!=='end_turn')throw new ClaudeError('The agent response was incomplete. Please try a shorter message.');
  if(!Array.isArray(result.content)||result.content.length!==1||result.content[0].type!=='text'||typeof result.content[0].text!=='string')throw new ClaudeError('The agent response was incomplete. Your draft is safe.');
  let parsed;
  try{parsed=JSON.parse(result.content[0].text);}catch{throw new ClaudeError('The agent response could not be read. Your draft is safe.');}
  return decodeProviderAnswer(parsed);
}

