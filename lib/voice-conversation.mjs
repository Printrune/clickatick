/** Spoken turns with injected recognition and speech; no browser or provider dependency. */
export function createVoiceConversation({createRecognition,synthesis,createUtterance,playSpeech,onState=()=>{},onTranscript=()=>{},onAnswer,maxTurns=Infinity,listenTimeoutMs=60000,speechTimeoutMs=90000,echoDelayMs=180,silenceDelayMs=1100,timers=globalThis}){
 let mode='off',phase='idle',turns=0,generation=0,disposed=false,recognition=null,speechAbort=null;
 let question={text:'',ticket:null},carry='',capturedText='',networkRetries=0,emptyRestarts=0,suspendedPhase=null,answerPending=false;
 const jobs=new Set();
 const current=token=>!disposed&&generation===token;
 const active=(token,expected)=>current(token)&&mode==='active'&&(!expected||phase===expected);
 const state=message=>onState({mode,phase,message,turns});
 function later(fn,delay){const id=timers.setTimeout(()=>{jobs.delete(id);fn();},delay);jobs.add(id);return id;}
 function clear(id){timers.clearTimeout(id);jobs.delete(id);}
 function detach(instance){if(!instance)return;instance.onstart=instance.onresult=instance.onend=instance.onerror=null;if(recognition===instance)recognition=null;}
 function cleanup(){for(const id of jobs)timers.clearTimeout(id);jobs.clear();const old=recognition;detach(old);try{old?.abort();}catch{}speechAbort?.abort();speechAbort=null;}
 function pause(message='Voice paused. Resume when you are ready.') {if(disposed)return;if(phase==='listening')carry=capturedText;generation++;cleanup();answerPending=false;suspendedPhase=null;mode='paused';phase='paused';state(message);}
 function normalise(reply){if(typeof reply==='string')return {text:reply.trim(),ticket:null};return reply&&typeof reply.text==='string'?{text:reply.text.trim(),ticket:reply.ticket||null}:null;}
 function nativeSpeech({text,signal,onStart}){return new Promise((resolve,reject)=>{let done=false;const speech=createUtterance(text);const finish=error=>{if(done)return;done=true;speech.onstart=speech.onend=speech.onerror=null;signal.removeEventListener('abort',abort);error?reject(error):resolve();};const abort=()=>{try{synthesis.cancel();}catch{}finish(new Error('cancelled'));};speech.onstart=onStart;speech.onend=()=>finish();speech.onerror=()=>finish(new Error('Speech unavailable'));signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}try{synthesis.speak(speech);}catch(error){finish(error);}});}
 function speak(token){
  if(!active(token))return;phase='preparing-speech';state('Preparing the spoken question.');
  const controller=new AbortController();speechAbort=controller;const timeout=later(()=>{if(active(token)&&speechAbort===controller)pause('The spoken question could not finish. Resume or type to continue.');},speechTimeoutMs);
  try{Promise.resolve((playSpeech||nativeSpeech)({...question,signal:controller.signal,onStart:()=>{if(active(token)&&speechAbort===controller){phase='speaking';state('The agent is asking a question.');}}})).then(()=>{if(!active(token)||speechAbort!==controller)return;clear(timeout);speechAbort=null;phase='speaking';later(()=>listen(token),echoDelayMs);},()=>{if(active(token)&&speechAbort===controller)pause('Spoken audio is unavailable. Resume or type to continue.');});}catch{if(active(token))pause('Spoken audio could not start. Resume or type to continue.');}
 }
 function submit(token,text){
  if(!active(token))return;carry='';phase='thinking';turns++;answerPending=true;onTranscript(text);state('Preparing your tickets and the next question.');
  Promise.resolve().then(()=>{if(!current(token)||!['active','suspended'].includes(mode))return;return onAnswer(text);}).then(reply=>{
   if(!current(token)||!['active','suspended'].includes(mode))return;answerPending=false;const next=normalise(reply);if(!next?.text){pause('No spoken reply was available. Review the conversation or resume voice.');return;}question=next;if(turns>=maxTurns){pause('Voice paused after '+maxTurns+' answers. Resume to continue.');return;}if(mode==='active')speak(token);
  }).catch(()=>{if(current(token)&&['active','suspended'].includes(mode))pause('The agent could not reply. Your answer is kept. Resume or type to continue.');});
 }
 function listen(token){
  if(!active(token))return;phase='listening';capturedText=carry;let instance,finished=false,stopping=false,idleTimer,silenceTimer;const finals=new Map();let interims=[];
  const text=()=>[carry,...finals.values(),...interims].filter(Boolean).join(' ').trim();
  const live=()=>active(token,'listening')&&recognition===instance&&!finished;
  function release(){finished=true;clear(idleTimer);clear(silenceTimer);detach(instance);}
  function rearm(delay,message){carry=text();release();try{instance.abort();}catch{}state(message);later(()=>listen(token),delay);}
  function rollover(){clear(idleTimer);idleTimer=later(()=>{if(!live())return;rearm(100,'Still listening. Take your time.');},listenTimeoutMs);}
  try{
   instance=createRecognition();recognition=instance;instance.continuous=true;instance.interimResults=true;instance.lang='en-US';
   instance.onstart=()=>{if(live())state('Listening. Start talking.');};
   instance.onresult=event=>{if(!live())return;networkRetries=0;emptyRestarts=0;clear(silenceTimer);interims=[];for(let i=0;i<event.results.length;i++){const result=event.results[i],words=result[0]?.transcript?.trim()||'';if(result.isFinal)finals.set(i,words);else interims.push(words);}capturedText=text();onTranscript(capturedText);if(!stopping)rollover();if(!stopping&&!interims.some(Boolean)&&text())silenceTimer=later(()=>{if(!live()||stopping)return;stopping=true;try{instance.stop();}catch{pause('Voice input could not finish. Your words are kept. Resume or type to continue.');}},silenceDelayMs);};
   instance.onend=()=>{if(!live())return;const answer=text(),unfinished=interims.some(Boolean);release();if(answer&&!unfinished){networkRetries=0;emptyRestarts=0;submit(token,answer);}else{carry=answer;later(()=>listen(token),Math.min(1000,150+emptyRestarts++*100));state('Listening again. Continue when you are ready.');}};
   instance.onerror=event=>{if(!live())return;capturedText=text();if(event.error==='no-speech'){rearm(Math.min(1000,150+emptyRestarts++*100),'Listening again. Take your time.');return;}if(event.error==='network'&&networkRetries<3){const delay=[300,800,1600][networkRetries++];rearm(delay,'Reconnecting your microphone. Your words are kept.');return;}const messages={'not-allowed':'Microphone access was not allowed. Allow access, then resume or type your answer.','service-not-allowed':'Speech recognition is unavailable. Type your answer or try voice again.','audio-capture':'No microphone is available. Connect a microphone or type your answer.',network:'Speech recognition could not reconnect. Your words are kept. Resume or type to continue.'};pause(messages[event.error]||'Voice input stopped. Your words are kept. Resume or type to continue.');};
   state('Starting your microphone. Allow access if asked, then start talking.');rollover();instance.start();
  }catch{pause('Voice input could not start. Resume or type to continue.');}
 }
 function begin(reply,{resume=false}={}){
  if(disposed)return;generation++;cleanup();const next=normalise(reply);if(next?.text)question=next;
  if(!question.text){pause('Choose a question before starting voice.');return;}
  if(typeof createRecognition!=='function'||(!playSpeech&&(typeof createUtterance!=='function'||!synthesis?.speak))){pause('This browser does not support spoken conversation. Type your answer instead.');return;}
  mode='active';suspendedPhase=null;answerPending=false;networkRetries=0;emptyRestarts=0;turns=0;if(!resume){carry='';onTranscript('');speak(generation);}else listen(generation);
 }
 return {start:reply=>begin(reply),resume:reply=>begin(reply,{resume:true}),pause,
  retry(text){if(disposed||!['paused','off'].includes(mode)||typeof text!=='string'||!text.trim())return;generation++;cleanup();mode='active';suspendedPhase=null;networkRetries=0;emptyRestarts=0;submit(generation,text.trim());},
  setVisibility(hidden){if(disposed)return;if(hidden){if(mode!=='active')return;suspendedPhase=phase;if(phase==='listening')carry=capturedText;mode='suspended';cleanup();phase='paused';state('Voice paused while this page is hidden.');}else if(mode==='suspended'){mode='active';if(answerPending){phase='thinking';state('Preparing your tickets and the next question.');}else if(suspendedPhase==='thinking')speak(generation);else listen(generation);suspendedPhase=null;}},
  interrupt(){if(!active(generation)||!['preparing-speech','speaking'].includes(phase))return;generation++;cleanup();carry='';onTranscript('');listen(generation);},
  stop(){if(disposed)return;generation++;cleanup();answerPending=false;suspendedPhase=null;carry='';mode='off';phase='idle';state('Voice is off.');},
  dispose(){if(disposed)return;generation++;cleanup();disposed=true;mode='off';phase='idle';},
 };
}
