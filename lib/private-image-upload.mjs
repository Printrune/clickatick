import {PhaseA1Error} from './integrated-phase-a1.mjs';

export const MAX_SERVER_IMAGE_BYTES=4000000;
const fail=(code,message,status)=>{throw new PhaseA1Error(code,message,status);};

export async function readBoundedImage(request,expectedBytes){
 const declared=request.headers.get('content-length');
 if(declared!==null){const n=Number(declared);if(!Number.isSafeInteger(n)||n<1)fail('INVALID_INPUT','Check the image size.',400);if(n>MAX_SERVER_IMAGE_BYTES)fail('BODY_TOO_LARGE','The image is too large.',413);if(n!==expectedBytes)fail('UPLOAD_VERIFICATION_FAILED','The image size does not match the upload request.',422);}
 const reader=request.body?.getReader();if(!reader)fail('INVALID_INPUT','Select an image.',400);
 const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_SERVER_IMAGE_BYTES){await reader.cancel();fail('BODY_TOO_LARGE','The image is too large.',413);}if(size>expectedBytes){await reader.cancel();fail('UPLOAD_VERIFICATION_FAILED','The image size does not match the upload request.',422);}chunks.push(Buffer.from(value));}}
 finally{reader.releaseLock();}
 if(size!==expectedBytes||size===0)fail('UPLOAD_VERIFICATION_FAILED','The image size does not match the upload request.',422);
 return Buffer.concat(chunks,size);
}

export function verifyServerImageIntent(asset,{uploadId,user,mime}){
 if(!asset||asset.media_type!=='image')fail('ASSET_NOT_FOUND','This image was not found.',404);
 if(asset.upload_subject!==user||String(asset.upload_id).toLowerCase()!==uploadId.toLowerCase())fail('ASSET_NOT_FOUND','This image was not found.',404);
 if(asset.source_mime!==mime||!['image/jpeg','image/png','image/webp'].includes(mime))fail('UNSUPPORTED_MEDIA_FORMAT','Use the image type selected for this upload.',422);
 if(asset.state==='ready')return 'ready';
 if(asset.state!=='pending'||new Date(asset.reservation_expires_at).getTime()<=Date.now())fail('UPLOAD_EXPIRED','This upload is unavailable.',410);
 if(!Number.isSafeInteger(Number(asset.source_bytes))||Number(asset.source_bytes)<1||Number(asset.source_bytes)>MAX_SERVER_IMAGE_BYTES)fail('BODY_TOO_LARGE','The image is too large.',413);
 return 'pending';
}
