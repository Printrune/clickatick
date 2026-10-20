import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {speechReady,speechCapability,issueSpeechTicket,verifySpeechTicket,replySpeech,createSpeechLimiter,handleSpeechRequest,SPEECH_PROMPTS,SPEECH_MODEL} from '../lib/speech-server.mjs';
const env={OPENAI_API_KEY:'test-openai-key-not-real',AI_ENABLED:'true',FABLE_SPEECH_ENABLED:'true',ANTHROPIC_BUDGET_CONFIRMED:'true'};
const tick=()=>issueSpeechTicket('What date is your event?','reply',env);
const request=(body,options={})=>new Request('https://clickatick.invalid/api/speech',{method:'POST',headers:{'content-type':'application/json',origin:'https://clickatick.invalid',host:'clickatick.invalid',...options.headers},body:typeof body==='string'?body:JSON.stringify(body),...options});
const config=(fetcher,other={})=>({sameOrigin:()=>true,env,fetcher,limits:createSpeechLimiter(),...other});
const pcm=bytes=>new Response(new Uint8Array(bytes),{headers:{'content-type':'audio/pcm'}});
test('speech requires every activation gate and keeps keys private',()=>{
 assert.equal(speechReady(env),true);
 for(const key of Object.keys(env))assert.equal(speechReady({...env,[key]:''}),false);
 assert.equal(speechCapability({}),undefined);assert.equal(replySpeech('Test',{}),undefined);
 const capability=speechCapability(env);assert.equal(capability.voice,'fable');assert.equal(capability.greeting.text,SPEECH_PROMPTS.greeting);assert.ok(!JSON.stringify(capability).includes(env.OPENAI_API_KEY));
});
test('signed tickets reject forgery, expiration, wrong key and arbitrary prompt text',()=>{
 const ticket=issueSpeechTicket('A valid question?','reply',env,1000000);
 assert.equal(verifySpeechTicket(ticket,env,1000001).text,'A valid question?');
 assert.throws(()=>verifySpeechTicket(ticket,env,1300000),e=>e.status===403);
 assert.throws(()=>verifySpeechTicket(ticket,{...env,OPENAI_API_KEY:'different-key'},1000001));
 const [payload,sig]=ticket.split('.'),data=JSON.parse(Buffer.from(payload,'base64url').toString());data.text='Forged text';
 assert.throws(()=>verifySpeechTicket(`${Buffer.from(JSON.stringify(data)).toString('base64url')}.${sig}`,env,1000001));
 assert.throws(()=>issueSpeechTicket('Wrong','greeting',env));assert.throws(()=>issueSpeechTicket('x'.repeat(3001),'reply',env));
 assert.equal(verifySpeechTicket(issueSpeechTicket('x'.repeat(3000),'reply',env),env).text.length,3000);
});
test('unconfigured and foreign-origin requests never call provider',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return pcm([0,0]);};
 assert.equal((await handleSpeechRequest(request({ticket:tick()}),config(fetcher,{env:{}}))).status,503);
 assert.equal((await handleSpeechRequest(request({ticket:tick()}),config(fetcher,{sameOrigin:()=>false}))).status,403);
 assert.equal(calls,0);
});
test('fixed-prompt refresh is free and cannot mint client-provided text',async()=>{
 let calls=0;const options=config(async()=>{calls++;return pcm([0,0]);});
 const response=await handleSpeechRequest(request({action:'prompts'}),options);assert.equal(response.status,200);const data=await response.json();assert.equal(verifySpeechTicket(data.speech.resume.ticket,env).text,SPEECH_PROMPTS.resume);
 for(const body of [{text:'Speak arbitrary text'},{action:'prompts',text:'Injected'},{ticket:tick(),voice:'alloy'},{ticket:'forged'}])assert.ok((await handleSpeechRequest(request(body),options)).status>=400);
 assert.equal(calls,0);
});
test('stream starts with first PCM chunk rather than waiting for complete audio',async()=>{
 let provider,seen,aborted=false;
 const response=await handleSpeechRequest(request({ticket:tick()}),config(async(url,options)=>{
  seen={url,options,body:JSON.parse(options.body)};options.signal.addEventListener('abort',()=>{aborted=true;});
  return new Response(new ReadableStream({start(c){provider=c;}}),{headers:{'content-type':'audio/pcm'}});
 }));
 assert.equal(response.headers.get('content-type'),'audio/pcm');assert.equal(response.headers.get('x-audio-sample-rate'),'24000');assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(seen.url,'https://api.openai.com/v1/audio/speech');assert.equal(seen.body.model,SPEECH_MODEL);assert.equal(seen.body.voice,'fable');assert.equal(seen.body.response_format,'pcm');assert.equal(seen.options.redirect,'error');
 const reader=response.body.getReader();provider.enqueue(new Uint8Array([1,0]));assert.deepEqual((await reader.read()).value,new Uint8Array([1,0]));
 provider.enqueue(new Uint8Array([2,0]));provider.close();assert.deepEqual((await reader.read()).value,new Uint8Array([2,0]));assert.equal((await reader.read()).done,true);assert.equal(aborted,false);
});
test('client cancel aborts upstream and releases concurrency slot',async()=>{
 let aborted=false;const limits=createSpeechLimiter({maxConcurrent:1});
 const options=config(async(url,init)=>{init.signal.addEventListener('abort',()=>{aborted=true;});return new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([0,0]));}}),{headers:{'content-type':'audio/pcm'}});},{limits});
 const first=await handleSpeechRequest(request({ticket:tick()}),options);
 assert.equal((await handleSpeechRequest(request({ticket:tick()}),options)).status,429);
 await first.body.cancel();assert.equal(aborted,true);
 const next=await handleSpeechRequest(request({ticket:tick()}),config(async()=>pcm([0,0]),{limits}));assert.equal(next.status,200);await next.arrayBuffer();
});
test('replay and rate limits reject before a second paid fetch',async()=>{
 let calls=0;const ticket=tick(),options=config(async()=>{calls++;return pcm([0,0]);},{limits:createSpeechLimiter({maxStarts:1})});
 const first=await handleSpeechRequest(request({ticket}),options);await first.arrayBuffer();
 assert.equal((await handleSpeechRequest(request({ticket}),options)).status,409);
 assert.equal((await handleSpeechRequest(request({ticket:tick()}),options)).status,429);assert.equal(calls,1);
});
test('oversized bodies and unsupported body shapes are rejected without provider call',async()=>{
 let calls=0;const options=config(async()=>{calls++;return pcm([0,0]);});
 assert.equal((await handleSpeechRequest(request('x'.repeat(16001)),options)).status,413);
 assert.equal((await handleSpeechRequest(request('bad json'),options)).status,400);
 assert.equal((await handleSpeechRequest(request([]),options)).status,400);assert.equal(calls,0);
});
test('provider errors are safe and never retried',async()=>{
 for(const [status,expected] of [[401,503],[402,503],[429,429],[500,502]]){
  let calls=0;const response=await handleSpeechRequest(request({ticket:tick()}),config(async()=>{calls++;return new Response('private key secret-canary',{status});}));
  assert.equal(response.status,expected);assert.ok(!(await response.text()).includes('secret-canary'));assert.equal(calls,1);
 }
});
test('timeout aborts upstream and reports a recoverable fixed error',async()=>{
 let aborted=false;const response=await handleSpeechRequest(request({ticket:tick()}),config(async(url,init)=>new Promise((resolve,reject)=>{init.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('secret'));});}),{timeoutMs:5}));
 assert.equal(response.status,502);assert.equal((await response.json()).code,'timeout');assert.equal(aborted,true);
});
test('deadline under downstream backpressure releases limiter and discards queued audio',async()=>{
 const limits=createSpeechLimiter({maxConcurrent:1});let cancelled=false;
 const first=await handleSpeechRequest(request({ticket:tick()}),config(async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([0,0]));},cancel(){cancelled=true;}}),{headers:{'content-type':'audio/pcm'}}),{limits,timeoutMs:10}));
 // Do not read the response until after its deadline; its first queued chunk must be discarded.
 await new Promise(resolve=>setTimeout(resolve,25));assert.equal(cancelled,true);await assert.rejects(first.arrayBuffer());
 const next=await handleSpeechRequest(request({ticket:tick()}),config(async()=>pcm([0,0]),{limits}));assert.equal(next.status,200);await next.arrayBuffer();
});
test('oversized, empty, malformed PCM and wrong content types do not complete playback',async()=>{
 for(const bytes of [[],[1],[0,0,0,0,0,0]]){const response=await handleSpeechRequest(request({ticket:tick()}),config(async()=>pcm(bytes),{maxAudioBytes:4}));await assert.rejects(response.arrayBuffer());}
 const response=await handleSpeechRequest(request({ticket:tick()}),config(async()=>Response.json({error:'not audio'})));assert.equal(response.status,502);
});
test('actual route delegates only to same-origin guarded streaming handler',async()=>{
 let source=await readFile(new URL('../app/api/speech/route.js',import.meta.url),'utf8');
 source=source.replace("import {sameOrigin} from '../../../lib/services';",'const sameOrigin=()=>false;').replace("'../../../lib/speech-server.mjs'",JSON.stringify(new URL('../lib/speech-server.mjs',import.meta.url).href));
 const {POST}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.equal((await POST(request({text:'unsolicited'}))).status,403);
});
