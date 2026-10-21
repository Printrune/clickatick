import {PhaseA1Error} from './integrated-phase-a1.mjs';
const failure=(code,message,status)=>{throw new PhaseA1Error(code,message,status);};
export const STORE_CEILING=950000000;
export function mediaCapabilities(reasonCode='CONNECTED_VERIFICATION_PENDING',imageEnabled=false,videoEnabled=false,videoPlaybackEnabled=false){
 const active=imageEnabled||videoEnabled||videoPlaybackEnabled,reason=active?null:'Media uploads are not connected yet.';
 return {imageUploadEnabled:imageEnabled,videoUploadEnabled:videoEnabled,videoPlaybackEnabled,reasonCode:active?null:reasonCode,reason};
}
export function mediaAssetSummary(row){
 const image=row.media_type!=='video',stored=row.byte_length===null?null:Number(row.byte_length),sourceStored=image?(row.source_stored_bytes===null?null:Number(row.source_stored_bytes)):null;
 const storageBytes=image?(stored===null||sourceStored===null?null:stored+sourceStored):stored;
 return {id:row.id,mediaType:image?'image':'video',kind:row.kind,state:row.state,version:Number(row.version),displayName:row.source_name||'Image',sourceBytes:row.source_bytes===null?null:Number(row.source_bytes),sourceStoredBytes:sourceStored,storedBytes:stored,storageBytes,sourceMime:row.source_mime||row.mime,storedMime:row.state==='ready'?row.mime:null,altText:row.alt_text||null,createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at||row.created_at).toISOString(),previewAvailable:row.state==='ready',referenceCount:Number(row.reference_count||0),sourceCleanupPending:Boolean(row.source_cleanup_pending),failure:row.failure_code?{code:row.failure_code,message:row.failure_message||'This upload needs attention.'}:null};
}
export function mediaUsageProjection(row,counts){
 const ready=row?.reconciliation_status==='ready'&&row?.last_full_scan_at&&Date.now()-new Date(row.last_full_scan_at).getTime()<60000;
 const observed=ready?Number(row.observed_bytes):null,reserved=ready?Number(row.reserved_bytes):null;
 const remaining=ready?Math.max(0,STORE_CEILING-observed-reserved):null;
 return {imageCount:Number(counts?.image_count||0),videoCount:Number(counts?.video_count||0),imageLimit:100,videoLimit:10,observedStoredBytes:observed,reservedBytes:reserved,sharedRemainingBytes:remaining,storageStatus:ready?(remaining<=0?'full':'ready'):'unknown',checkedAt:ready?new Date(row.last_full_scan_at).toISOString():null};
}
export function claimBudget({observedBytes,reservedBytes,requestedBytes,knownAllWriters,scanFresh}){
 if(!knownAllWriters||!scanFresh||![observedBytes,reservedBytes,requestedBytes].every(Number.isSafeInteger)||Math.min(observedBytes,reservedBytes,requestedBytes)<0)failure('STORAGE_USAGE_UNKNOWN','Shared storage usage is unavailable.',503);
 if(observedBytes+reservedBytes+requestedBytes>STORE_CEILING)failure('SHARED_STORE_FULL','Shared storage is full.',507);
 return observedBytes+reservedBytes+requestedBytes;
}
export async function scanEntireStore(listPage,{maxObjects=10000,maxPages=100}={}){
 const paths=new Map();let cursor,observedBytes=0,pages=0;
 for(;;){if(++pages>maxPages)failure('STORAGE_USAGE_UNKNOWN','Shared storage inventory is incomplete.',503);
  const page=await listPage({cursor,limit:1000,mode:'expanded'});
  if(!page||!Array.isArray(page.blobs)||typeof page.hasMore!=='boolean')failure('STORAGE_USAGE_UNKNOWN','Shared storage inventory is incomplete.',503);
  for(const blob of page.blobs){if(typeof blob.pathname!=='string'||!blob.pathname||!Number.isSafeInteger(blob.size)||blob.size<0||paths.has(blob.pathname)||paths.size>=maxObjects)failure('STORAGE_USAGE_UNKNOWN','Shared storage inventory is incomplete.',503);paths.set(blob.pathname,blob.size);observedBytes+=blob.size;if(!Number.isSafeInteger(observedBytes))failure('STORAGE_USAGE_UNKNOWN','Shared storage inventory is incomplete.',503);}
  if(!page.hasMore)return {paths,observedBytes,pages};
  if(typeof page.cursor!=='string'||!page.cursor||page.cursor===cursor)failure('STORAGE_USAGE_UNKNOWN','Shared storage inventory is incomplete.',503);cursor=page.cursor;
 }
}
export async function normalizePrivateImage(bytes,{sharpLoader=()=>import('sharp')}={}){
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<1||bytes.byteLength>10000000)failure('IMAGE_SOURCE_TOO_LARGE','Check the image size.',413);
 const sharp=(await sharpLoader()).default;
 try{
  const source=sharp(bytes,{limitInputPixels:12000000,failOn:'error',animated:false}),meta=await source.metadata();
  if(!['jpeg','png','webp'].includes(meta.format)||!meta.width||!meta.height||meta.width>4096||meta.height>4096||meta.width*meta.height>12000000||(meta.pages||1)>1)failure('IMAGE_DECODE_FAILED','Check the image file.',422);
  for(const quality of [82,72,62,52]){const output=await sharp(bytes,{limitInputPixels:12000000,failOn:'error',animated:false}).rotate().webp({quality}).toBuffer();if(output.byteLength<=5000000){const checked=await sharp(output).metadata();if(checked.width>4096||checked.height>4096||checked.exif||checked.xmp||checked.icc)failure('IMAGE_DECODE_FAILED','The image could not be made safe.',422);return {bytes:output,mime:'image/webp',width:checked.width,height:checked.height};}}
  failure('IMAGE_OUTPUT_TOO_LARGE','The processed image is too large.',422);
 }catch(error){if(error instanceof PhaseA1Error)throw error;failure('IMAGE_DECODE_FAILED','Check the image file.',422);}
}
