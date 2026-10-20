import test from 'node:test';
import assert from 'node:assert/strict';
import {providerDTO} from './provider-fixture.mjs';
import {claudeReady,claudeCompletion,CLAUDE_MODEL} from '../lib/claude-ai.mjs';
const env={AI_ENABLED:'true',AI_PROVIDER:'anthropic',ANTHROPIC_API_KEY:'test-only',ANTHROPIC_BUDGET_CONFIRMED:'true'};
const input={system:'Listing assistant',messages:[{role:'user',content:'Create a pottery event'}]};
const ok=()=>Response.json({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(providerDTO({reply:'Where is the event?',patch:{},sources:[],pending:[]}))}]});
test('all activation gates are mandatory; old gateway credentials cannot enable Claude',()=>{
 assert.equal(claudeReady(env),true);
 for(const key of Object.keys(env))assert.equal(claudeReady({...env,[key]:''}),false);
 assert.equal(claudeReady({...env,AI_MODEL:'different-model'}),false);
 assert.equal(claudeReady({AI_ENABLED:'true',AI_FREE_TIER_CONFIRMED:'true',AI_GATEWAY_API_KEY:'old'}),false);
});
test('unconfirmed spending cannot reach the network',async()=>{
 let calls=0;
 await assert.rejects(claudeCompletion(input,{...env,ANTHROPIC_BUDGET_CONFIRMED:'false'},async()=>{calls++;return ok();}),e=>e.status===503);
 assert.equal(calls,0);
});
test('single direct Messages request uses server key, pinned model and strict structured shape',async()=>{
 let calls=0;
 const answer=await claudeCompletion(input,env,async(url,options)=>{
  calls++;assert.equal(url,'https://api.anthropic.com/v1/messages');
  assert.equal(options.headers['x-api-key'],'test-only');assert.equal(options.redirect,'error');
  const body=JSON.parse(options.body);
  assert.equal(body.model,CLAUDE_MODEL);assert.equal(body.max_tokens,1800);
  assert.equal(body.system,input.system);assert.deepEqual(body.messages,input.messages);
  assert.equal(body.output_config.format.type,'json_schema');
  assert.equal(body.output_config.format.schema.additionalProperties,false);
  assert.equal(body.tools,undefined);assert.deepEqual(body.thinking,{type:'between_tools'});assert.equal(body.output_config.effort,'low');assert.equal(body.temperature,undefined);
  return ok();
 });
 assert.equal(answer.reply,'Where is the event?');assert.equal(calls,1);
});
for(const status of [400,401,402,403,429,500])test(`status ${status} never exposes provider details or retries`,async()=>{
 let calls=0;
 await assert.rejects(claudeCompletion(input,env,async()=>{calls++;return Response.json({error:{message:'private-key-and-upstream-data'}},{status});}),e=>!e.message.includes('private-key')&&e.status>=429);
 assert.equal(calls,1);
});
test('oversized UTF-8 input cannot call provider',async()=>{
 let calls=0;
 await assert.rejects(claudeCompletion({...input,system:'🦉'.repeat(11000)},env,async()=>{calls++;return ok();}),e=>e.status===413);
 assert.equal(calls,0);
});
for(const body of [{stop_reason:'max_tokens',content:[]},{stop_reason:'refusal',content:[]},{stop_reason:'end_turn',content:[{type:'text',text:'broken'}]}])test('incomplete or invalid model output rejected',async()=>{
 await assert.rejects(claudeCompletion(input,env,async()=>Response.json(body)));
});
test('network failure never exposes secret exception',async()=>{
 await assert.rejects(claudeCompletion(input,env,async()=>{throw new Error('test-only key');}),e=>!e.message.includes('test-only'));
});

const diagnosticCases=[
 [400,'invalid_request_error','Your credit balance is too low to access the Anthropic API.','low_credits'],
 [402,'invalid_request_error','Payment required','low_credits'],
 [400,'invalid_request_error','Insufficient credits','low_credits'],
 [404,'not_found_error','model: unavailable-model does not exist','model_unavailable'],
 [400,'invalid_request_error','Model is not supported','model_unavailable'],
 [400,'invalid_request_error','Invalid JSON schema','invalid_schema'],
 [400,'invalid_request_error','output_config: Extra inputs are not permitted','invalid_schema'],
 [400,'invalid_request_error','messages: invalid argument','invalid_messages'],
 [401,'authentication_error','invalid x-api-key','authentication'],
 [403,'permission_error','forbidden','permission'],
 [429,'rate_limit_error','rate exceeded','rate_limit'],
 [413,'request_too_large','large','request_too_large'],
 [529,'overloaded_error','busy','overloaded'],
 [500,'api_error','private-key-and-upstream-data','unavailable']
];
for(const [status,type,message,code] of diagnosticCases)test(`safe diagnostic ${code}: ${message}`,async()=>{
 let calls=0;
 await assert.rejects(claudeCompletion(input,env,async()=>{
  calls++;return Response.json({error:{type,message:message+' secret-canary-123'}},{status});
 }),error=>error.code===code&&error.upstreamStatus===status&&!error.message.includes('secret-canary')&&error.message.includes('Your draft is safe.'));
 assert.equal(calls,1);
});
for(const [message,code] of [
 ['Organization must complete verification','account_verification'],
 ['API access is not supported in this country','region_unavailable'],
 ['The model has been retired','model_retired'],
 ['max_tokens is invalid','token_limit'],
 ['messages: first message must use the user role','invalid_messages']
])test(`additional request diagnostic ${code}`,async()=>{
 await assert.rejects(claudeCompletion(input,env,async()=>Response.json({error:{type:'invalid_request_error',message}},{status:400})),error=>error.code===code&&!error.message.includes(message));
});

test('fallback diagnostic returns only fixed vocabulary, never provider excerpts',async()=>{
 await assert.rejects(claudeCompletion(input,env,async()=>Response.json({error:{type:'invalid_request_error',message:'Subscription key requires approval secret-canary-123 sk-ant-private-value'}},{status:400})),error=>error.message.includes('Diagnostic: subscription, key.')&&!error.message.includes('secret-canary')&&!error.message.includes('sk-ant-'));
});
test('unsupported OAuth receives explicit safe credential type diagnostic',async()=>{
 await assert.rejects(claudeCompletion(input,env,async()=>Response.json({error:{type:'invalid_request_error',message:'OAuth authentication is currently not supported'}},{status:400})),error=>error.code==='unsupported_authentication');
});

test('workspace spending cap receives fixed allowance message',async()=>{
 await assert.rejects(claudeCompletion(input,env,async()=>Response.json({error:{type:'invalid_request_error',message:'Your organization has reached its spending limit'}},{status:400})),error=>error.code==='spend_limit');
});
test('outer key whitespace is normalized without exposing credentials',async()=>{
 await claudeCompletion(input,{...env,ANTHROPIC_API_KEY:'  test-only\n'},async(url,options)=>{assert.equal(options.headers['x-api-key'],'test-only');return ok();});
});
for(const key of ['ANTHROPIC_API_KEY=test-only','"test-only"',"'test-only'",'Bearer test-only','test only','test\nonly'])test('malformed credential rejected before provider call',async()=>{
 let calls=0;
 await assert.rejects(claudeCompletion(input,{...env,ANTHROPIC_API_KEY:key},async()=>{calls++;return ok();}),error=>error.code==='credential_configuration'&&!error.message.includes(key));
 assert.equal(calls,0);
});
test('provider key header rejection has actionable fixed message',async()=>{
 await assert.rejects(claudeCompletion(input,env,async()=>Response.json({error:{type:'invalid_request_error',message:'Invalid key header secret-canary'}},{status:400})),error=>error.code==='credential_configuration'&&!error.message.includes('secret-canary'));
});


test('explicit supported legacy model uses its compatible settings and never falls back',async()=>{
 let calls=0;await claudeCompletion(input,{...env,AI_MODEL:'claude-haiku-4-5-20251001'},async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.model,'claude-haiku-4-5-20251001');assert.equal(body.thinking,undefined);assert.equal(body.output_config.effort,undefined);return ok();});assert.equal(calls,1);
});
