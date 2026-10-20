'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {createAvatarAnalyzer} from '../lib/avatar-client.mjs';

const messages={
 idle:'',requesting:'Allow camera access to personalize your character. You can keep creating tickets.',
 capturing:'Taking one quick snapshot. It stays on this device.',
 analyzing:'Updating your character. Your camera is now off.',
 ready:'Your character is ready. The snapshot has been discarded.',
 denied:'Camera access was declined. You can keep creating tickets.',
 unavailable:'Camera personalization is unavailable. Continue creating your tickets.',
 'no-face':'No clear face was found. Your character stays unchanged.',
 cancelled:'Camera personalization stopped.',
};

function waitForFrame(video,signal){
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(new DOMException('Cancelled','AbortError'));return;}
  let frame,timer,finished=false;
  function finish(error){if(finished)return;finished=true;clearTimeout(timer);video.removeEventListener('loadeddata',check);signal.removeEventListener('abort',abort);if(frame!==undefined)video.cancelVideoFrameCallback?.(frame);error?reject(error):resolve();}
  function abort(){finish(new DOMException('Cancelled','AbortError'));}
  function check(){if(video.readyState>=2&&video.videoWidth>0){if(video.requestVideoFrameCallback)frame=video.requestVideoFrameCallback(()=>finish());else finish();}}
  timer=setTimeout(()=>finish(Error('No camera frame')),5000);
  signal.addEventListener('abort',abort,{once:true});video.addEventListener('loadeddata',check,{once:true});check();
 });
}

export default forwardRef(function CameraPortrait({appearance,onAppearance,onStatus},ref){
 const [state,setState]=useState('idle');
 const video=useRef(null),stream=useRef(null),attempted=useRef(false),generation=useRef(0),aborter=useRef(null),analyzer=useRef(null),mounted=useRef(true),stateRef=useRef('idle');
 const callbacks=useRef({onAppearance,onStatus});callbacks.current={onAppearance,onStatus};
 function status(next){if(!mounted.current)return;stateRef.current=next;setState(next);callbacks.current.onStatus?.({state:next,message:messages[next]});}
 function stopStream(){stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null;}
 function cancel(){generation.current++;aborter.current?.abort();aborter.current=null;analyzer.current?.cancel();analyzer.current=null;stopStream();if(['requesting','capturing','analyzing'].includes(stateRef.current))status('cancelled');}
 async function request(retry=false){
  if(attempted.current&&!retry)return;
  attempted.current=true;const current=++generation.current;
  aborter.current?.abort();analyzer.current?.cancel();stopStream();
  const controller=new AbortController();aborter.current=controller;status('requesting');
  let canvas;
  try{
   if(!navigator.mediaDevices?.getUserMedia||typeof Worker==='undefined'||typeof createImageBitmap==='undefined')throw Error('Unavailable');
   // Before the first await: permission originates directly from the bubble click.
   const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
   if(current!==generation.current||!mounted.current){media.getTracks().forEach(track=>track.stop());return;}
   stream.current=media;status('capturing');
   const element=video.current;element.srcObject=media;
   const frame=waitForFrame(element,controller.signal);element.play().catch(()=>{});await frame;
   if(current!==generation.current)return;
   canvas=document.createElement('canvas');
   const scale=Math.min(1,640/element.videoWidth);canvas.width=Math.round(element.videoWidth*scale);canvas.height=Math.round(element.videoHeight*scale);
   canvas.getContext('2d').drawImage(element,0,0,canvas.width,canvas.height);
   stopStream();status('analyzing');
   const task=createAvatarAnalyzer();analyzer.current=task;
   const result=await task.analyze(canvas);
   if(current!==generation.current||!mounted.current)return;
   callbacks.current.onAppearance?.(result);status('ready');
  }catch(error){
   if(current!==generation.current||!mounted.current)return;
   status(error.name==='NotAllowedError'?'denied':error.code==='no-face'?'no-face':error.name==='AbortError'||error.code==='cancelled'?'cancelled':'unavailable');
  }finally{
   if(current===generation.current){stopStream();analyzer.current=null;aborter.current=null;}
   if(canvas){canvas.width=0;canvas.height=0;}
  }
 }
 useImperativeHandle(ref,()=>({request:()=>request(false),cancel}));
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++;aborter.current?.abort();analyzer.current?.cancel();stopStream();};},[]);
 const busy=['requesting','capturing','analyzing'].includes(state);
 return <div className="camera-portrait camera-avatar-controller">
  <video ref={video} hidden muted playsInline autoPlay aria-hidden="true" tabIndex={-1}/>
  <button type="button" className="scene-control camera-trigger" disabled={busy} onClick={()=>request(true)} aria-label={appearance?'Update character from camera':'Personalize character with camera'} title={appearance?'Update character from camera':'Personalize character with camera'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6 9.5 3.5h5L16 6h4v14H4V6h4Z"/><circle cx="12" cy="12.5" r="3.5"/></svg></button>
 </div>;
});
