import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';

export const SPEECH_MODEL='gpt-4o-mini-tts-2025-12-15';
export const SPEECH_VOICE='fable';
export const SPEECH_PROMPTS={greeting:'Hi! What event or activity would you like to create tickets for?',resume:'What would you like to add or change about your tickets?'};
const TICKET_MS=5*60*1000,MAX_TEXT=3000,MAX_BODY=16000,MAX_AUDIO=2160000;
export class SpeechError extends Error {
 constructor(message,status=502,code='unavailable'){super(message);this.status=status;this.code=code;}
}
export function speechReady(env=process.env){
 const key=env.OPENAI_API_KEY?.trim();
 return env.FABLE_SPEECH_ENABLED==='true'&&env.AI_ENABLED==='true'&&env.ANTHROPIC_BUDGET_CONFIRMED==='true'&&typeof key==='string'&&/^[A-Za-z0-9_-]{8,}$/.test(key)&&!/^OPENAI_API_KEY/i.test(key);
}
function signature(payload,env){return createHmac('sha256',env.OPENAI_API_KEY.trim()).update(`clickatick-speech-v1:${payload}`).digest();}
export function issueSpeechTicket(text,purpose='reply',env=process.env,now=Date.now()){
 if(!speechReady(env))return undefined;
 if(typeof text!=='string'||!text.trim()||text.length>MAX_TEXT||!['reply','greeting','resume'].includes(purpose))throw new SpeechError('This reply cannot be spoken. Please read it in the conversation.',400,'invalid_text');
 if(purpose!=='reply'&&text!==SPEECH_PROMPTS[purpose])throw new SpeechError('The voice prompt is invalid.',400,'invalid_prompt');
 const payload=Buffer.from(JSON.stringify({v:1,text,purpose,iat:now,exp:now+TICKET_MS,nonce:randomUUID()})).toString('base64url');
 return `${payload}.${signature(payload,env).toString('base64url')}`;
}
export function verifySpeechTicket(ticket,env=process.env,now=Date.now()){
 if(!speechReady(env))throw new SpeechError('Fable voice is not connected. You can continue with the browser voice or typing.',503,'unconfigured');
 const invalid=()=>new SpeechError('This voice request is invalid or expired. Please continue the conversation.',403,'invalid_ticket');
 if(typeof ticket!=='string'||ticket.length>15000||!(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/).test(ticket))throw invalid();
 const [payload,sig]=ticket.split('.'),expected=signature(payload,env),provided=Buffer.from(sig,'base64url');
 if(provided.length!==expected.length||!timingSafeEqual(expected,provided))throw invalid();
 let data;try{data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));}catch{throw invalid();}
 if(data?.v!==1||typeof data.text!=='string'||!data.text.trim()||data.text.length>MAX_TEXT||!['reply','greeting','resume'].includes(data.purpose)||!Number.isSafeInteger(data.iat)||data.iat>now+30000||data.exp!==data.iat+TICKET_MS||data.exp<=now||typeof data.nonce!=='string'||!(/^[a-f0-9-]{36}$/).test(data.nonce))throw invalid();
 if(data.purpose!=='reply'&&data.text!==SPEECH_PROMPTS[data.purpose])throw invalid();
 return data;
}
export function speechCapability(env=process.env,now=Date.now()){
 if(!speechReady(env))return undefined;
 return {enabled:true,voice:SPEECH_VOICE,...Object.fromEntries(Object.entries(SPEECH_PROMPTS).map(([purpose,text])=>[purpose,{text,ticket:issueSpeechTicket(text,purpose,env,now)}]))};
}
export function replySpeech(text,env=process.env){const ticket=issueSpeechTicket(text,'reply',env);return ticket?{ticket}:undefined;}

// Process-local controls limit bursts, not distributed spend. Provider spend controls remain necessary.
export function createSpeechLimiter({maxStarts=30,maxConcurrent=2,windowMs=60000}={}){
 let starts=[],active=0;const used=new Map();
 return {claim(data,now=Date.now()){
  starts=starts.filter(time=>time>now-windowMs);for(const [nonce,expiry] of used)if(expiry<=now)used.delete(nonce);
  if(used.has(data.nonce))throw new SpeechError('This reply has already been requested. Please continue the conversation.',409,'replayed');
  if(active>=maxConcurrent||starts.length>=maxStarts)throw new SpeechError('Voice is busy. Please wait before continuing.',429,'rate_limit');
  used.set(data.nonce,data.exp);starts.push(now);active++;let released=false;
  return ()=>{if(!released){released=true;active--;}};
 }};
}
const limiter=createSpeechLimiter();
async function boundedJSON(request){
 const declared=request.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>MAX_BODY))throw new SpeechError('This voice request is too large.',413,'too_large');
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new SpeechError('Send a valid voice request.',400,'invalid_request');
 const reader=request.body?.getReader();if(!reader)throw new SpeechError('Send a voice ticket.',400,'invalid_request');
 const chunks=[];let bytes=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_BODY){await reader.cancel();throw new SpeechError('This voice request is too large.',413,'too_large');}chunks.push(value);}}finally{reader.releaseLock();}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new SpeechError('Send a valid voice request.',400,'invalid_request');}
}
function errorResponse(error){
 const safe=error instanceof SpeechError?error:new SpeechError('Voice could not connect. You can continue typing.');
 return Response.json({error:safe.message,code:safe.code},{status:safe.status,headers:{'Cache-Control':'no-store'}});
}
function providerFailure(status){
 if(status===401||status===403)return new SpeechError('The Fable voice connection needs an account check. You can continue typing.',503,'credentials');
 if(status===402)return new SpeechError('Fable voice has no available credits. You can continue typing.',503,'credits');
 if(status===429)return new SpeechError('The voice provider limit was reached. Please wait before continuing.',429,'provider_limit');
 return new SpeechError('Fable voice is unavailable. You can continue typing.',502,'provider_error');
}
export async function handleSpeechRequest(request,{sameOrigin,env=process.env,fetcher=fetch,limits=limiter,now=Date.now,timeoutMs=45000,maxAudioBytes=MAX_AUDIO}={}){
 if(!sameOrigin(request))return errorResponse(new SpeechError('Please use the clickatick website.',403,'origin'));
 if(!speechReady(env))return errorResponse(new SpeechError('Fable voice is not connected. You can continue with the browser voice or typing.',503,'unconfigured'));
 let release=()=>{},cleanup=()=>{};
 try{
  const body=await boundedJSON(request);
  if(!body||typeof body!=='object'||Array.isArray(body))throw new SpeechError('Send a valid voice request.',400,'invalid_request');
  if(body.action==='prompts'&&Object.keys(body).length===1)return Response.json({speech:speechCapability(env,now())},{headers:{'Cache-Control':'no-store'}});
  if(Object.keys(body).length!==1||!Object.hasOwn(body,'ticket'))throw new SpeechError('Send a signed voice ticket.',400,'invalid_request');
  const data=verifySpeechTicket(body.ticket,env,now());release=limits.claim(data,now());
  const controller=new AbortController();let reader,outputController,timedOut=false,closed=false,streamTerminated=false;
  const abort=()=>{controller.abort();if(reader)void reader.cancel().catch(()=>{});cleanup();if(outputController&&!streamTerminated){streamTerminated=true;outputController.error(new Error(timedOut?'Voice playback timed out.':'Voice playback was interrupted.'));}};
  const timer=setTimeout(()=>{timedOut=true;abort();},timeoutMs);
  request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)abort();
  cleanup=()=>{if(!closed){closed=true;clearTimeout(timer);request.signal.removeEventListener('abort',abort);release();}};
  let response;
  try{response=await fetcher('https://api.openai.com/v1/audio/speech',{method:'POST',cache:'no-store',redirect:'error',signal:controller.signal,headers:{Authorization:`Bearer ${env.OPENAI_API_KEY.trim()}`,'Content-Type':'application/json'},body:JSON.stringify({model:SPEECH_MODEL,voice:SPEECH_VOICE,input:data.text,response_format:'pcm',stream_format:'audio',instructions:'Speak warmly and naturally in a clear, relaxed conversation. Use a steady pace and connected phrasing. Make questions sound inviting. Use brief natural punctuation pauses, without dramatic pauses or theatrical delivery.'})});}
  catch{throw new SpeechError(timedOut?'Voice took too long to respond. Please continue typing.':'Voice could not connect. You can continue typing.',502,timedOut?'timeout':'network');}
  if(controller.signal.aborted){await response.body?.cancel();throw new SpeechError('Voice was interrupted. Please continue the conversation.',502,timedOut?'timeout':'cancelled');}
  if(!response.ok){await response.body?.cancel();throw providerFailure(response.status);}
  if(!/^(audio\/pcm|application\/octet-stream)(;|$)/i.test(response.headers.get('content-type')||'')){await response.body?.cancel();throw new SpeechError('The voice response had an unexpected format.',502,'invalid_audio');}
  if(!response.body)throw new SpeechError('The voice response was empty.',502,'empty_audio');
  reader=response.body.getReader();let bytes=0;
  const stream=new ReadableStream({
   start(output){outputController=output;},
   async pull(output){try{
    if(controller.signal.aborted)throw new Error('Aborted');
    const {done,value}=await reader.read();
    if(controller.signal.aborted)throw new Error('Aborted');
    if(done){if(!bytes||bytes%2)throw new Error('Invalid audio');cleanup();streamTerminated=true;output.close();return;}
    bytes+=value.byteLength;if(bytes>maxAudioBytes){abort();throw new Error('Too long');}output.enqueue(value);
   }catch{abort();cleanup();}},
   async cancel(){streamTerminated=true;abort();cleanup();}
  });
  return new Response(stream,{headers:{'Content-Type':'audio/pcm','X-Audio-Sample-Rate':'24000','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){cleanup();release();return errorResponse(error);}
}
