import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceConversation} from '../lib/voice-conversation.mjs';
function setup(overrides={}){
 let clock=0,id=0,cancels=0;const jobs=new Map(),states=[],transcripts=[],recognitions=[],speeches=[],answers=[];
 const timers={setTimeout(fn,delay){const key=++id;jobs.set(key,{fn,time:clock+delay});return key;},clearTimeout(key){jobs.delete(key);}};
 const tick=ms=>{const end=clock+ms;let loops=0;while(true){const item=[...jobs].filter(([,v])=>v.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!item)break;if(++loops>5000)throw Error('Timer loop');jobs.delete(item[0]);clock=item[1].time;item[1].fn();}clock=end;};
 const controller=createVoiceConversation({createRecognition(){const r={starts:0,stops:0,aborted:false,start(){this.starts++;},stop(){this.stops++;},abort(){this.aborted=true;}};recognitions.push(r);return r;},synthesis:{speak(s){speeches.push(s);s.onstart?.();},cancel(){cancels++;}},createUtterance:text=>({text}),onState:s=>states.push(s),onTranscript:t=>transcripts.push(t),onAnswer:text=>{answers.push(text);return 'Next question?';},timers,listenTimeoutMs:60000,speechTimeoutMs:4000,echoDelayMs:10,silenceDelayMs:20,...overrides});
 const result=(r,parts)=>r.onresult({results:parts.map(([text,final=true])=>Object.assign([{transcript:text}],{isFinal:final}))});
 return {controller,tick,jobs,states,transcripts,recognitions,speeches,answers,result,cancels:()=>cancels};
}
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
async function finishSpeech(h){h.speeches.at(-1).onend();await flush();h.tick(10);}
async function start(h){h.controller.start('Opening question?');await finishSpeech(h);return h.recognitions.at(-1);}
async function answer(h,text='A walking tour'){const r=h.recognitions.at(-1);h.result(r,[[text]]);h.tick(20);assert.equal(r.stops,1);r.onend();await flush();}

test('start speaks opening immediately; microphone waits for playback end; manual resume listens',async()=>{const h=setup();h.controller.start('Opening?');assert.equal(h.speeches[0].text,'Opening?');assert.equal(h.recognitions.length,0);await finishSpeech(h);assert.equal(h.recognitions.length,1);h.controller.pause();h.controller.resume();assert.equal(h.recognitions.length,2);assert.equal(h.speeches.length,1);h.controller.dispose();assert.equal(h.jobs.size,0);});
test('async speech distinguishes preparation from real playback and cancellation',async()=>{let request,resolve;const h=setup({playSpeech:args=>{request=args;return new Promise(done=>{resolve=done;});}});h.controller.start({text:'Hi',ticket:'signed'});assert.equal(h.states.at(-1).phase,'preparing-speech');assert.equal(request.ticket,'signed');request.onStart();assert.equal(h.states.at(-1).phase,'speaking');h.controller.pause();assert.equal(request.signal.aborted,true);request.onStart();resolve();await flush();h.tick(20);assert.equal(h.recognitions.length,0);assert.equal(h.states.at(-1).mode,'paused');});
test('silence ends once and accepted answer speaks then listens automatically',async()=>{const h=setup();const r=await start(h),oldEnd=r.onend;h.result(r,[['Twenty guests']]);h.tick(19);assert.equal(r.stops,0);h.tick(1);assert.equal(r.stops,1);oldEnd();oldEnd();await flush();assert.deepEqual(h.answers,['Twenty guests']);assert.equal(h.speeches.at(-1).text,'Next question?');await finishSpeech(h);assert.equal(h.recognitions.length,2);h.controller.dispose();});
test('interim activity cancels silence; transcript parts remain in order',async()=>{const h=setup(),r=await start(h);h.result(r,[['A tour']]);h.tick(10);h.result(r,[['A tour'],['with twenty',false]]);h.tick(30);assert.equal(r.stops,0);h.result(r,[['A tour'],['with twenty people']]);h.tick(20);r.onend();await flush();assert.deepEqual(h.answers,['A tour with twenty people']);h.controller.dispose();});
test('ordinary empty end and no-speech automatically rearm without pausing',async()=>{const h=setup(),r=await start(h);r.onend();h.tick(150);assert.equal(h.recognitions.length,2);h.recognitions.at(-1).onerror({error:'no-speech'});h.tick(250);assert.equal(h.recognitions.length,3);assert.equal(h.states.at(-1).mode,'active');h.controller.dispose();});
test('interim-only browser end preserves words across restart',async()=>{const h=setup(),r=await start(h);h.result(r,[['A walking',false]]);r.onend();h.tick(150);const next=h.recognitions.at(-1);h.result(next,[['tour for twenty']]);h.tick(20);next.onend();await flush();assert.deepEqual(h.answers,['A walking tour for twenty']);h.controller.dispose();});
test('network retry is bounded and preserves transcript without duplication',async()=>{const h=setup(),r=await start(h);h.result(r,[['Partial',false]]);for(const delay of [300,800,1600]){h.recognitions.at(-1).onerror({error:'network'});assert.equal(h.states.at(-1).mode,'active');h.tick(delay);}h.recognitions.at(-1).onerror({error:'network'});assert.equal(h.states.at(-1).mode,'paused');assert.match(h.states.at(-1).message,/could not reconnect/);assert.equal(h.transcripts.at(-1),'Partial');assert.equal(h.jobs.size,0);});
test('sixty second timer rolls idle recognition over and resets with ongoing speech',async()=>{const h=setup(),r=await start(h);h.tick(59000);h.result(r,[['Speaking',false]]);h.tick(59000);assert.equal(r.aborted,false);h.tick(1000);assert.equal(r.aborted,true);assert.equal(h.states.at(-1).mode,'active');h.tick(100);assert.equal(h.recognitions.length,2);h.controller.dispose();});
test('no default twelve-turn cap',async()=>{const h=setup();await start(h);for(let i=0;i<14;i++){await answer(h,'Answer '+i);await finishSpeech(h);}assert.equal(h.answers.length,14);assert.equal(h.states.at(-1).mode,'active');h.controller.dispose();});
test('permission failure pauses and never retries',async()=>{const h=setup(),r=await start(h);h.result(r,[['Words',false]]);const oldEnd=r.onend;r.onerror({error:'not-allowed'});oldEnd();h.tick(100000);assert.equal(h.recognitions.length,1);assert.equal(h.transcripts.at(-1),'Words');assert.equal(h.states.at(-1).mode,'paused');assert.equal(h.jobs.size,0);});
test('hidden page resumes only its own suspension and keeps transcript',async()=>{const h=setup(),r=await start(h);h.result(r,[['Keep this',false]]);h.controller.setVisibility(true);assert.equal(r.aborted,true);assert.equal(h.states.at(-1).mode,'suspended');h.controller.setVisibility(false);assert.equal(h.recognitions.length,2);h.result(h.recognitions.at(-1),[['answer']]);assert.equal(h.transcripts.at(-1),'Keep this answer');h.controller.setVisibility(true);h.controller.pause();h.controller.setVisibility(false);assert.equal(h.recognitions.length,2);h.controller.dispose();});
test('pending answer can complete while hidden and speaks when visible',async()=>{let resolve;const h=setup({onAnswer:()=>new Promise(done=>{resolve=done;})});await start(h);await answer(h);h.controller.setVisibility(true);resolve({text:'New question?',ticket:'new-ticket'});await flush();assert.equal(h.speeches.length,1);h.controller.setVisibility(false);assert.equal(h.speeches.at(-1).text,'New question?');h.controller.dispose();});
test('manual pause ignores pending response; stop and dispose block stale callbacks',async()=>{let resolve;const h=setup({onAnswer:()=>new Promise(done=>{resolve=done;})});await start(h);await answer(h);h.controller.pause();resolve('Stale');await flush();assert.equal(h.speeches.length,1);h.controller.resume();const r=h.recognitions.at(-1),end=r.onend;h.controller.stop();end();h.tick(100000);assert.equal(h.states.at(-1).mode,'off');h.controller.dispose();h.controller.start('No');assert.equal(h.speeches.length,1);});
test('interrupt cancels preparing or playing audio, immediately listens and ignores old speech completion',async()=>{const h=setup();h.controller.start('Hi');const end=h.speeches[0].onend;h.controller.interrupt();assert.equal(h.cancels(),1);assert.equal(h.recognitions.length,1);end();await flush();h.tick(10);assert.equal(h.recognitions.length,1);h.controller.dispose();});
test('audio failure and deadline pause safely without automatic paid retry',async()=>{const h=setup({playSpeech:()=>Promise.reject(new Error('offline'))});h.controller.start('Hi');await flush();assert.equal(h.states.at(-1).mode,'paused');const x=setup({playSpeech:()=>new Promise(()=>{})});x.controller.start('Hi');x.tick(4000);assert.equal(x.states.at(-1).mode,'paused');assert.equal(x.jobs.size,0);});

test('visibility return never replays a consumed speech ticket',async()=>{let plays=0,request;const h=setup({playSpeech:args=>{plays++;request=args;return new Promise(()=>{});}});h.controller.start({text:'Hello',ticket:'one-use'});h.controller.setVisibility(true);assert.equal(request.signal.aborted,true);h.controller.setVisibility(false);assert.equal(plays,1);assert.equal(h.recognitions.length,1);h.controller.dispose();});

test('partial no-speech recovery does not duplicate transcript',async()=>{const h=setup(),r=await start(h);h.result(r,[['Keep me',false]]);r.onerror({error:'no-speech'});h.tick(150);h.recognitions.at(-1).onerror({error:'no-speech'});h.tick(250);const next=h.recognitions.at(-1);h.result(next,[['please']]);h.tick(20);next.onend();await flush();assert.deepEqual(h.answers,['Keep me please']);h.controller.dispose();});

test('final recognition results delivered during stop are retained',async()=>{const h=setup(),r=await start(h);h.result(r,[['A tour']]);h.tick(20);assert.equal(r.stops,1);h.result(r,[['A tour'],['for twenty guests']]);r.onend();await flush();assert.deepEqual(h.answers,['A tour for twenty guests']);h.controller.dispose();});

test('successful date clarification is spoken and listening continues into the corrected answer',async()=>{
 const answers=[],clarification='Which year should these tours run?';
 const h=setup({onAnswer:text=>{answers.push(text);return {text:answers.length===1?clarification:'What time should the tour start?'};}});
 await start(h);await answer(h,'2 days before Halloween');
 assert.equal(h.states.at(-1).mode,'active');assert.equal(h.speeches.at(-1).text,clarification);
 assert.equal(h.transcripts.at(-1),'2 days before Halloween');
 await finishSpeech(h);assert.equal(h.states.at(-1).phase,'listening');
 await answer(h,'October 29, 2026');assert.deepEqual(answers,['2 days before Halloween','October 29, 2026']);
 assert.equal(h.speeches.at(-1).text,'What time should the tour start?');
 await finishSpeech(h);assert.equal(h.states.at(-1).mode,'active');assert.equal(h.states.at(-1).phase,'listening');h.controller.dispose();
});

test('actual answer request failure stays explicit, preserves words and never retries automatically',async()=>{
 let requests=0;const h=setup({onAnswer:()=>{requests++;return Promise.reject(new Error('Service unavailable'));}});
 await start(h);await answer(h,'2 days before Halloween');h.tick(100000);await flush();
 assert.equal(requests,1);assert.equal(h.states.at(-1).mode,'paused');assert.match(h.states.at(-1).message,/Your answer is kept/);
 assert.equal(h.transcripts.at(-1),'2 days before Halloween');assert.equal(h.speeches.length,1);assert.equal(h.jobs.size,0);h.controller.dispose();
});

test('explicit retry makes exactly one new request, then speaks and listens without recording during the request',async()=>{
 let calls=0;const h=setup({onAnswer:()=>++calls===1?Promise.reject(new Error('Unavailable')):'What ticket price should I use?'});
 await start(h);await answer(h,'Twenty guests');assert.equal(h.states.at(-1).mode,'paused');
 h.controller.retry('Twenty guests');assert.equal(h.states.at(-1).phase,'thinking');assert.equal(h.recognitions.length,1);
 await flush();assert.equal(calls,2);assert.equal(h.speeches.at(-1).text,'What ticket price should I use?');
 h.controller.retry('Twenty guests');await flush();assert.equal(calls,2);
 await finishSpeech(h);assert.equal(h.states.at(-1).phase,'listening');assert.equal(h.recognitions.length,2);h.controller.dispose();
});

test('saved voice answer can be explicitly retried after reload while voice is initially off',async()=>{
 const h=setup();h.controller.retry('Saved answer');await flush();assert.deepEqual(h.answers,['Saved answer']);assert.equal(h.speeches[0].text,'Next question?');await finishSpeech(h);assert.equal(h.states.at(-1).phase,'listening');h.controller.dispose();
});
