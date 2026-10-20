import test from 'node:test';
import assert from 'node:assert/strict';
import {appearanceFromFace} from '../lib/avatar-features.mjs';
import {createAvatarAnalyzer} from '../lib/avatar-client.mjs';

function fixture(){
 const width=300,height=300,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;data.set(y<62?(x>85&&x<215?[45,28,20,255]:[140,45,40,255]):[178,125,91,255],i);}
 const landmarks=Array.from({length:478},()=>({x:.5,y:.5}));
 Object.assign(landmarks,{10:{x:.5,y:.25},152:{x:.5,y:.85},234:{x:.26,y:.5},454:{x:.74,y:.5},50:{x:.38,y:.55},280:{x:.62,y:.55},151:{x:.5,y:.32}});
 return {image:{width,height,data},landmarks};
}
test('visible face patches produce bounded styling only',()=>{
 const {image,landmarks}=fixture(),result=appearanceFromFace(image,landmarks);
 assert.equal(result.skinColor,'#b27d5b');assert.equal(result.hairColor,'#2d1c14');assert.equal(result.hairStyle,'short');
 assert.deepEqual(Object.keys(result).sort(),['faceHeight','faceWidth','hairColor','hairStyle','skinColor']);
 assert.ok(result.faceWidth>=.85&&result.faceWidth<=1.15);assert.ok(result.faceHeight>=.85&&result.faceHeight<=1.15);
});
test('no face is rejected rather than using whole-frame color',()=>{
 const {image}=fixture();assert.throws(()=>appearanceFromFace(image,[]),{code:'no-face'});
});
test('hair above a broad forehead uses the gray hair band, not forehead skin',()=>{
 const {image,landmarks}=fixture();
 for(let y=0;y<75;y++)for(let x=0;x<image.width;x++){
  const color=x>85&&x<215?(y>=30&&y<50?[68,70,69,255]:[178,125,91,255]):[140,45,40,255];
  image.data.set(color,(y*image.width+x)*4);
 }
 const result=appearanceFromFace(image,landmarks);
 assert.equal(result.hairColor,'#444645');assert.equal(result.hairStyle,'short');assert.notEqual(result.hairColor,result.skinColor);
});
test('skin-like hair bands fall back to restrained cropped styling',()=>{
 const {image,landmarks}=fixture();for(let i=0;i<image.data.length;i+=4)image.data.set([178,125,91,255],i);
 const result=appearanceFromFace(image,landmarks);assert.equal(result.hairColor,'#3a2d2a');assert.equal(result.hairStyle,'cropped');
});
test('uniform backdrop bands are not treated as a hair cap',()=>{
 const {image,landmarks}=fixture();
 for(let y=0;y<62;y++)for(let x=0;x<image.width;x++)image.data.set([140,45,40,255],(y*image.width+x)*4);
 const result=appearanceFromFace(image,landmarks);assert.equal(result.hairColor,'#3a2d2a');assert.equal(result.hairStyle,'cropped');
});
test('dark clothing beside the lower face does not imply long hair',()=>{
 const {image,landmarks}=fixture();
 for(let y=190;y<250;y++)for(let x=50;x<250;x++)if(x<82||x>218)image.data.set([45,28,20,255],(y*image.width+x)*4);
 assert.equal(appearanceFromFace(image,landmarks).hairStyle,'short');
});
test('long hair requires matching vertical bands on both sides',()=>{
 const {image,landmarks}=fixture();
 for(let y=90;y<220;y++)for(let x=55;x<245;x++)if(x<82||x>218)image.data.set([45,28,20,255],(y*image.width+x)*4);
 assert.equal(appearanceFromFace(image,landmarks).hairStyle,'long');
});
test('tiny or clipped faces keep the neutral appearance',()=>{
 const {image,landmarks}=fixture();landmarks[234].x=.48;landmarks[454].x=.52;
 assert.throws(()=>appearanceFromFace(image,landmarks),{code:'no-face'});
 landmarks[234].x=0;assert.throws(()=>appearanceFromFace(image,landmarks),{code:'no-face'});
});
test('transparent face patches do not produce invalid colors',()=>{
 const {image,landmarks}=fixture();image.data.fill(0);assert.throws(()=>appearanceFromFace(image,landmarks),{code:'no-face'});
});
test('malformed image data fails safely',()=>assert.throws(()=>appearanceFromFace({width:1,height:1,data:[]},[]),{code:'unavailable'}));
function fakeWorker(){return {terminated:0,postMessage(){},terminate(){this.terminated++;}};}
test('initialization resolves and closes worker resources',async()=>{
 const worker=fakeWorker(),analyzer=createAvatarAnalyzer({workerFactory:()=>worker});
 const promise=analyzer.initialize();worker.onmessage({data:{ready:true}});
 assert.equal(await promise,true);assert.equal(worker.terminated,1);
});
test('model timeout rejects without leaving a worker running',async()=>{
 const worker=fakeWorker(),analyzer=createAvatarAnalyzer({workerFactory:()=>worker,timeoutMs:5});
 await assert.rejects(analyzer.initialize(),{code:'unavailable'});assert.equal(worker.terminated,1);
});
test('cancellation rejects a pending model load and closes once',async()=>{
 const worker=fakeWorker(),analyzer=createAvatarAnalyzer({workerFactory:()=>worker});
 const promise=analyzer.initialize();analyzer.cancel();analyzer.cancel();
 await assert.rejects(promise,{code:'cancelled'});assert.equal(worker.terminated,1);
});
test('no-face detection returns a typed failure and closes worker',async()=>{
 const worker=fakeWorker(),analyzer=createAvatarAnalyzer({workerFactory:()=>worker});
 const promise=analyzer.initialize();worker.onmessage({data:{error:'no-face'}});
 await assert.rejects(promise,{code:'no-face'});assert.equal(worker.terminated,1);
});
test('worker creation failure rejects without waiting for timeout',async()=>{
 const analyzer=createAvatarAnalyzer({workerFactory:()=>{throw Error('blocked');}});
 await assert.rejects(analyzer.initialize(),{code:'unavailable'});
});
test('analysis discards canvas and pixel buffers even on no-face failure',async()=>{
 const previous=globalThis.createImageBitmap,worker=fakeWorker();let closed=0;
 globalThis.createImageBitmap=async()=>({close(){closed++;}});
 const {image}=fixture(),canvas={width:image.width,height:image.height,getContext:()=>({getImageData:()=>image})};
 try{
  const analyzer=createAvatarAnalyzer({workerFactory:()=>worker});const pending=analyzer.analyze(canvas);
  await new Promise(resolve=>setImmediate(resolve));worker.onmessage({data:{error:'no-face'}});
  await assert.rejects(pending,{code:'no-face'});assert.equal(canvas.width,0);assert.equal(canvas.height,0);assert.ok(image.data.every(value=>value===0));assert.equal(closed,1);
 }finally{globalThis.createImageBitmap=previous;}
});
