export class DemoError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export const LISTING_BYTES=2*1024*1024;
export const RECEIPT_BYTES=16*1024;
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function demoId(value){if(typeof value!=='string'||!UUID.test(value))throw new DemoError('The demo identifier is not valid.');return value.toLowerCase();}
export function exactKeys(value,keys){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
export async function readDemoJson(stream,limit){
 if(!stream)throw new DemoError('Add the demo details.');
 const reader=stream.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new DemoError('These demo details are too large.',413);}chunks.push(value);}}
 finally{reader.releaseLock();}
 try{return JSON.parse(Buffer.concat(chunks.map(chunk=>Buffer.from(chunk)),size).toString('utf8'));}catch{throw new DemoError('The demo details could not be read.');}
}
const requests=new Map();
export function demoPostGuard(request,now=Date.now()){
 const length=Number(request.headers.get('content-length'));if(Number.isFinite(length)&&length>LISTING_BYTES)throw new DemoError('These demo details are too large.',413);
 const minute=Math.floor(now/60000),key='write';const previous=requests.get(key);
 if(!previous||previous.minute!==minute){requests.set(key,{minute,count:1});return;}
 if(previous.count>=30)throw new DemoError('This demo is receiving too many requests. Try again in a minute.',429);previous.count++;
}
export function demoErrorResponse(error){const known=error instanceof DemoError,status=known?error.status:503;return Response.json({error:known?error.message:'Demo storage is unavailable. Your draft and selections are kept.'},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'60'}:{})}});}
