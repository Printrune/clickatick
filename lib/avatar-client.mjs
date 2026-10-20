import {AvatarCaptureError,appearanceFromFace} from './avatar-features.mjs';

// A classic worker retains importScripts for MediaPipe's official WASM loader.
export function createAvatarAnalyzer({workerFactory=()=>new Worker('/avatar-worker.js'),timeoutMs=25000}={}) {
  let worker,pending,timer,settled=false;
  function settle(error,value){if(settled)return;settled=true;clearTimeout(timer);worker?.terminate();worker=null;error?pending?.reject(error):pending?.resolve(value);}
  function start(message,transfer=[]){
    return new Promise((resolve,reject)=>{
      if(settled){reject(new AvatarCaptureError('cancelled'));return;}
      pending={resolve,reject};
      try{
        worker=workerFactory();
        worker.onmessage=event=>{
          if(event.data?.error)settle(new AvatarCaptureError(event.data.error));
          else if(event.data?.ready)settle(null,true);
          else if(Array.isArray(event.data?.landmarks))settle(null,event.data.landmarks);
        };
        worker.onerror=()=>settle(new AvatarCaptureError('unavailable'));
        timer=setTimeout(()=>settle(new AvatarCaptureError('unavailable')),timeoutMs);
        worker.postMessage(message,transfer);
      }catch{settle(new AvatarCaptureError('unavailable'));}
    });
  }
  return {
    initialize:()=>start({type:'initialize'}),
    async analyze(canvas){
      let image,bitmap;
      try{
        image=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height);
        bitmap=await createImageBitmap(canvas);
        if(settled)throw new AvatarCaptureError('cancelled');
        const landmarks=await start({type:'analyze',bitmap},[bitmap]);
        return appearanceFromFace(image,landmarks);
      }finally{bitmap?.close();image?.data.fill(0);canvas.width=0;canvas.height=0;}
    },
    cancel(){settle(new AvatarCaptureError('cancelled'));},
  };
}
export async function initAvatarAnalyzer(options){const analyzer=createAvatarAnalyzer(options);try{return await analyzer.initialize();}finally{analyzer.cancel();}}
export async function analyzeAvatarCanvas(canvas,options){const analyzer=createAvatarAnalyzer(options);try{return await analyzer.analyze(canvas);}finally{analyzer.cancel();}}
