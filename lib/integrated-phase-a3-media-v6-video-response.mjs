import {PhaseA1Error} from './integrated-phase-a1.mjs';
const fail=(code,message,status)=>{throw new PhaseA1Error(code,message,status);};
export function parseSingleRange(value,size){
 if(value===null)return null;
 if(!Number.isSafeInteger(size)||size<1||typeof value!=='string'||value.includes(',')||!/^bytes=(\d*)-(\d*)$/.test(value))return {invalid:true};
 const [,a,b]=/^bytes=(\d*)-(\d*)$/.exec(value);if(!a&&!b)return {invalid:true};
 let start,end;if(a){start=Number(a);end=b?Number(b):size-1;}else{const count=Number(b);if(!Number.isSafeInteger(count)||count<1)return {invalid:true};start=Math.max(0,size-count);end=size-1;}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)return {invalid:true};
 end=Math.min(end,size-1);return {start,end,length:end-start+1};
}
export async function servePrivateVideo({method,range,asset,head,get}){
 if(!['GET','HEAD'].includes(method)||asset?.state!=='ready'||asset.media_type!=='video'||asset.mime!=='video/mp4')fail('ASSET_NOT_FOUND','This video was not found.',404);
 const size=Number(asset.byte_length);if(!Number.isSafeInteger(size)||size<1||size>100000000)fail('MEDIA_UNAVAILABLE','Video size is unavailable.',503);
 const parsed=parseSingleRange(range,size),base={'Accept-Ranges':'bytes','Content-Type':'video/mp4','Cache-Control':'private, no-store','Content-Disposition':'inline','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Vary':'Cookie'};
 if(parsed?.invalid)return new Response(null,{status:416,headers:{...base,'Content-Range':`bytes */${size}`}});
 if(method==='HEAD'){const meta=await head(asset.private_blob_path);if(!meta||meta.pathname!==asset.private_blob_path||meta.size!==size||meta.contentType!=='video/mp4')fail('MEDIA_UNAVAILABLE','Video storage could not be verified.',503);return new Response(null,{status:parsed?206:200,headers:{...base,'Content-Length':String(parsed?.length||size),...(parsed?{'Content-Range':`bytes ${parsed.start}-${parsed.end}/${size}`}:{})}});}
 const result=await get(asset.private_blob_path,parsed?{headers:{Range:`bytes=${parsed.start}-${parsed.end}`}}:{});
 if(!result?.stream||result.blob?.pathname!==asset.private_blob_path||result.blob?.size!==size)fail('MEDIA_UNAVAILABLE','The video cannot be opened.',503);
 // Never label a full Blob response as partial. A range-ignore upstream fails closed.
 if(parsed){const upstream=result.headers?.get('content-range');if(upstream!==`bytes ${parsed.start}-${parsed.end}/${size}`){await result.stream.cancel();fail('MEDIA_UNAVAILABLE','Private video range delivery is unavailable.',503);}return new Response(result.stream,{status:206,headers:{...base,'Content-Length':String(parsed.length),'Content-Range':upstream}});}
 return new Response(result.stream,{status:200,headers:{...base,'Content-Length':String(size)}});
}
