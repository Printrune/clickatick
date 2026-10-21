import {createHash,randomUUID} from 'node:crypto';
import {PhaseA1Error} from './integrated-phase-a1.mjs';
import {claimBudget,mediaAssetSummary} from './integrated-phase-a3-media-v6-core.mjs';
const fail=(code,message,status,extra={})=>{const error=new PhaseA1Error(code,message,status);Object.assign(error,extra);throw error;};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function parseMediaIntent(body){
 const keys=['uploadId','mediaType','kind','sourceName','sourceMime','sourceBytes','eventId'];
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).sort().join(',')!==keys.sort().join(','))fail('INVALID_INPUT','Check the media details.',400);
 const {uploadId,mediaType,kind,sourceMime,sourceBytes,eventId}=body;
 if(typeof uploadId!=='string'||!UUID.test(uploadId)||eventId!==null&&(typeof eventId!=='string'||!UUID.test(eventId)))fail('INVALID_INPUT','Check the media identifier.',400);
 if(mediaType!=='image'&&mediaType!=='video'||typeof body.sourceName!=='string'||body.sourceName.length<1||body.sourceName.length>120||/[/\\\x00-\x1f]/.test(body.sourceName))fail('INVALID_INPUT','Check the media details.',400);
 if(!Number.isSafeInteger(sourceBytes)||sourceBytes<1||sourceBytes>(mediaType==='image'?10000000:100000000))fail(mediaType==='image'?'IMAGE_SOURCE_TOO_LARGE':'VIDEO_SOURCE_TOO_LARGE','The file is too large.',413);
 if(mediaType==='image'&&(!['business','event-location','cover','poster'].includes(kind)||!['image/jpeg','image/png','image/webp'].includes(sourceMime)))fail('UNSUPPORTED_MEDIA_FORMAT','Use a JPEG, PNG or WebP image.',422);
 if(mediaType==='video'&&(kind!=='event-video'||sourceMime!=='video/mp4'))fail('UNSUPPORTED_MEDIA_FORMAT','Use an MP4 video.',422);
 return {uploadId:uploadId.toLowerCase(),mediaType,kind,sourceName:body.sourceName.trim(),sourceMime,sourceBytes,eventId:eventId?.toLowerCase()||null};
}
export async function reserveMediaIntentTx(q,{org,user,storeId,input,allWritersCoordinated,assetId=randomUUID(),nonce=randomUUID()}){
 const requestHash=digest(input);
 const prior=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND upload_subject=$2 AND upload_id=$3::uuid',[org,user,input.uploadId]))[0];
 if(prior){if(prior.request_hash!==requestHash)fail('UPLOAD_ID_CONFLICT','This upload ID was used for different details.',409);return {asset:prior,replayed:true};}
 const brand=(await q("SELECT id FROM organizers WHERE id=$1::uuid AND status='active' FOR UPDATE",[org]))[0];if(!brand)fail('BRAND_NOT_FOUND','This brand was not found.',404);
 const ledger=(await q('SELECT * FROM blob_store_usage WHERE store_id=$1 FOR UPDATE',[storeId]))[0];
 const scanFresh=ledger?.reconciliation_status==='ready'&&ledger.last_full_scan_at&&Date.now()-new Date(ledger.last_full_scan_at).getTime()<60000;
 const required=input.sourceBytes+(input.mediaType==='image'?5000000:0);
 claimBudget({observedBytes:Number(ledger?.observed_bytes),reservedBytes:Number(ledger?.reserved_bytes),requestedBytes:required,knownAllWriters:allWritersCoordinated,scanFresh});
 const counts=(await q(`SELECT count(*) FILTER (WHERE media_type=$2 AND state IN ('pending','uploading','verifying','reconciling','ready','deleting'))::int AS items,count(*) FILTER (WHERE state IN ('pending','uploading','verifying','reconciling'))::int AS pending,count(*) FILTER (WHERE created_at>now()-interval '1 hour')::int AS hourly FROM organizer_media_assets WHERE organizer_id=$1::uuid`,[org,input.mediaType]))[0];
 if(Number(counts.items)>=(input.mediaType==='image'?100:10))fail(input.mediaType==='image'?'BRAND_IMAGE_LIMIT':'BRAND_VIDEO_LIMIT','This brand has reached its media limit.',422);
 if(Number(counts.pending)>=2||Number(counts.hourly)>=10)fail('UPLOAD_RATE_LIMITED','Try again later.',429);
 if(input.eventId){const event=(await q('SELECT id FROM organizer_event_drafts WHERE organizer_id=$1::uuid AND id=$2::uuid',[org,input.eventId]))[0];if(!event)fail('EVENT_NOT_FOUND','This event was not found.',404);}
 const base=`brands/${org}/assets/${assetId}/${nonce}`,sourcePath=input.mediaType==='image'?`${base}.source`:`${base}.mp4`,normalizedPath=input.mediaType==='image'?`${base}.webp`:sourcePath;
 const asset=(await q(`INSERT INTO organizer_media_assets(id,organizer_id,private_blob_path,mime,byte_length,width,height,alt_text,state,created_by_clerk_user_id,kind,version,upload_id,upload_subject,request_hash,reservation_expires_at,media_type,source_name,source_mime,source_bytes,source_blob_path,source_stored_bytes,source_cleanup_pending)
 VALUES($1::uuid,$2::uuid,$3,$4,NULL,NULL,NULL,'','pending',$5,$6,1,$7::uuid,$5,$8,now()+interval '10 minutes',$9,$10,$4,$11,$12,0,false) RETURNING *`,[assetId,org,normalizedPath,input.sourceMime,user,input.kind,input.uploadId,requestHash,input.mediaType,input.sourceName,input.sourceBytes,input.mediaType==='image'?sourcePath:null]))[0];
 await q("INSERT INTO media_upload_reservations(asset_id,store_id,declared_source_bytes,output_allowance_bytes,reserved_bytes,expires_at) VALUES($1::uuid,$2,$3,$4,$5,now()+interval '10 minutes')",[assetId,storeId,input.sourceBytes,input.mediaType==='image'?5000000:0,required]);
 await q('UPDATE blob_store_usage SET reserved_bytes=reserved_bytes+$2,generation=generation+1,updated_at=now() WHERE store_id=$1',[storeId,required]);
 return {asset,replayed:false};
}
export function tokenOptionsForAsset(asset,pathname){
 const expected=asset.media_type==='image'?asset.source_blob_path:asset.private_blob_path;
 if(asset.state!=='pending'&&asset.state!=='uploading'||!expected||pathname!==expected||new Date(asset.reservation_expires_at)<=new Date())fail('UPLOAD_EXPIRED','This upload is unavailable.',410);
 if(!Number.isSafeInteger(Number(asset.source_bytes))||Number(asset.source_bytes)<1)fail('UPLOAD_VERIFICATION_FAILED','The upload reservation is invalid.',422);
 return {allowedContentTypes:[asset.source_mime],maximumSizeInBytes:Number(asset.source_bytes),validUntil:new Date(asset.reservation_expires_at).getTime(),addRandomSuffix:false,allowOverwrite:false,tokenPayload:JSON.stringify({assetId:asset.id,organizerId:asset.organizer_id})};
}
export function verifySourceHead(asset,head){const expected=asset.media_type==='image'?asset.source_blob_path:asset.private_blob_path;if(!head||head.pathname!==expected||head.contentType!==asset.source_mime||!Number.isSafeInteger(head.size)||head.size<1||head.size>Number(asset.source_bytes))fail('UPLOAD_VERIFICATION_FAILED','The uploaded file did not match its reservation.',422);return head.size;}
export function intentProjection(asset,org,usage,capabilities){const path=asset.media_type==='image'?asset.source_blob_path:asset.private_blob_path;return {asset:mediaAssetSummary({...asset,reference_count:0}),uploadId:asset.upload_id,uploadPath:path,handleUploadUrl:`/api/v1/organizers/${org}/assets/client-upload`,expiresAt:new Date(asset.reservation_expires_at).toISOString(),usage,capabilities};}
