import {PhaseA1Error} from './integrated-phase-a1.mjs';
import {normalizePrivateImage,STORE_CEILING} from './integrated-phase-a3-media-v6-core.mjs';
import {verifySourceHead} from './integrated-phase-a3-media-v6-write.mjs';
import {inspectH264AacMp4} from './integrated-phase-a3-media-v6-mp4.mjs';
const fail=(code,message,status)=>{throw new PhaseA1Error(code,message,status);};
async function bytesFromStream(stream,max){const reader=stream.getReader(),parts=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();fail('UPLOAD_VERIFICATION_FAILED','The uploaded file is larger than its reservation.',422);}parts.push(Buffer.from(value));}}finally{reader.releaseLock();}return Buffer.concat(parts,size);}
export async function processCompletedImage({org,assetId,transaction,blob,normalize=normalizePrivateImage}){
 const asset=await transaction(async q=>{
  const r=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];
  if(!r||r.media_type!=='image')fail('ASSET_NOT_FOUND','This image was not found.',404);
  if(r.state==='ready')return r;
  if(!['pending','uploading','verifying'].includes(r.state))fail('UPLOAD_VERIFICATION_FAILED','This upload cannot be completed.',422);
  if(r.state==='verifying'&&Date.now()-new Date(r.updated_at).getTime()<120000)fail('UPLOAD_IN_PROGRESS','Image processing is already running.',409);
  await q("UPDATE organizer_media_assets SET state='verifying',processing_generation=processing_generation+1,updated_at=now() WHERE id=$1::uuid",[assetId]);return {...r,state:'verifying'};
 });
 if(asset.state==='ready'){await cleanupImageSource({org,assetId,transaction,blob});return {ready:true,alreadyReady:true};}
 const source=await blob.head(asset.source_blob_path),sourceSize=verifySourceHead(asset,source);
 const input=await blob.get(asset.source_blob_path);if(!input?.stream)fail('UPLOAD_VERIFICATION_FAILED','The uploaded image cannot be opened.',422);
 const raw=await bytesFromStream(input.stream,Number(asset.source_bytes));if(raw.length!==sourceSize)fail('UPLOAD_VERIFICATION_FAILED','The uploaded image size changed.',422);
 const normalized=await normalize(raw);
 try{await blob.put(asset.private_blob_path,normalized.bytes,{contentType:normalized.mime});}catch(error){const existing=await blob.headOrNull(asset.private_blob_path);if(!existing||existing.size!==normalized.bytes.length||existing.contentType!==normalized.mime)throw error;}
 const output=await blob.head(asset.private_blob_path);
 if(output.pathname!==asset.private_blob_path||output.contentType!==normalized.mime||output.size!==normalized.bytes.length||output.size>5000000)fail('UPLOAD_VERIFICATION_FAILED','The processed image could not be verified.',422);
 await transaction(async q=>{
  const current=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];
  if(current.state==='ready')return;
  if(current.state!=='verifying'||current.private_blob_path!==output.pathname||current.source_blob_path!==source.pathname)fail('UPLOAD_VERIFICATION_FAILED','This upload changed during processing.',422);
  const reservation=(await q('SELECT * FROM media_upload_reservations WHERE asset_id=$1::uuid FOR UPDATE',[assetId]))[0];if(!reservation)fail('STORAGE_USAGE_UNKNOWN','The upload reservation is unavailable.',503);
  const ledger=(await q('SELECT * FROM blob_store_usage WHERE store_id=$1 FOR UPDATE',[reservation.store_id]))[0];
  if(!ledger||ledger.reconciliation_status!=='ready'||Number(ledger.reserved_bytes)<Number(reservation.reserved_bytes)||Number(ledger.observed_bytes)+Number(ledger.reserved_bytes)>STORE_CEILING)fail('STORAGE_USAGE_UNKNOWN','Shared storage usage is unavailable.',503);
  const existing=await q('SELECT pathname FROM blob_store_inventory WHERE store_id=$1 AND pathname IN ($2,$3)',[reservation.store_id,source.pathname,output.pathname]);
  if(existing.length)fail('STORAGE_USAGE_UNKNOWN','Storage inventory changed during processing.',503);
  await q("UPDATE organizer_media_assets SET state='ready',mime=$2,byte_length=$3,width=$4,height=$5,source_stored_bytes=$6,source_cleanup_pending=true,reservation_expires_at=NULL,updated_at=now(),version=version+1 WHERE id=$1::uuid",[assetId,normalized.mime,output.size,normalized.width,normalized.height,sourceSize]);
  await q('INSERT INTO blob_store_inventory(store_id,pathname,byte_length,scan_generation) VALUES($1,$2,$3,$4),($1,$5,$6,$4)',[reservation.store_id,source.pathname,sourceSize,Number(ledger.generation)+1,output.pathname,output.size]);
  await q('UPDATE blob_store_usage SET observed_bytes=observed_bytes+$2,reserved_bytes=reserved_bytes-$3,generation=generation+1,updated_at=now() WHERE store_id=$1',[reservation.store_id,sourceSize+output.size,reservation.reserved_bytes]);
  await q('DELETE FROM media_upload_reservations WHERE asset_id=$1::uuid',[assetId]);
 });
 await cleanupImageSource({org,assetId,transaction,blob});
 return {ready:true,alreadyReady:false};
}
export async function processCompletedVideo({org,assetId,transaction,blob,inspect=inspectH264AacMp4}){
 const asset=await transaction(async q=>{
  const r=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];
  if(!r||r.media_type!=='video')fail('ASSET_NOT_FOUND','This video was not found.',404);
  if(r.state==='ready')return r;
  if(!['pending','uploading','verifying'].includes(r.state))fail('UPLOAD_VERIFICATION_FAILED','This video cannot be completed.',422);
  if(r.state==='verifying'&&Date.now()-new Date(r.updated_at).getTime()<120000)fail('UPLOAD_IN_PROGRESS','Video processing is already running.',409);
  await q("UPDATE organizer_media_assets SET state='verifying',processing_generation=processing_generation+1,updated_at=now() WHERE id=$1::uuid",[assetId]);return {...r,state:'verifying'};
 });
 if(asset.state==='ready')return {ready:true,alreadyReady:true};
 const head=await blob.head(asset.private_blob_path),size=verifySourceHead(asset,head);
 const response=await blob.get(asset.private_blob_path);if(!response?.stream)fail('UPLOAD_VERIFICATION_FAILED','The video cannot be opened.',422);
 const bytes=await bytesFromStream(response.stream,Number(asset.source_bytes));if(bytes.length!==size)fail('UPLOAD_VERIFICATION_FAILED','The video size changed.',422);
 try{inspect(bytes);}catch(error){
  await transaction(async q=>{const row=(await q('SELECT state FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];if(row?.state==='verifying')await q("UPDATE organizer_media_assets SET state='reconciling',failure_code='UNSUPPORTED_MEDIA_CODEC',failure_message='Use H.264 video with AAC audio.',updated_at=now() WHERE id=$1::uuid",[assetId]);});
  throw error;
 }
 await transaction(async q=>{
  const current=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];
  if(current.state==='ready')return;
  if(current.state!=='verifying'||current.private_blob_path!==head.pathname)fail('UPLOAD_VERIFICATION_FAILED','This upload changed during processing.',422);
  const reservation=(await q('SELECT * FROM media_upload_reservations WHERE asset_id=$1::uuid FOR UPDATE',[assetId]))[0];if(!reservation)fail('STORAGE_USAGE_UNKNOWN','The upload reservation is unavailable.',503);
  const ledger=(await q('SELECT * FROM blob_store_usage WHERE store_id=$1 FOR UPDATE',[reservation.store_id]))[0];
  if(!ledger||ledger.reconciliation_status!=='ready'||Number(ledger.reserved_bytes)<Number(reservation.reserved_bytes)||Number(ledger.observed_bytes)+Number(ledger.reserved_bytes)>STORE_CEILING)fail('STORAGE_USAGE_UNKNOWN','Shared storage usage is unavailable.',503);
  const existing=await q('SELECT pathname FROM blob_store_inventory WHERE store_id=$1 AND pathname=$2',[reservation.store_id,head.pathname]);if(existing.length)fail('STORAGE_USAGE_UNKNOWN','Storage inventory changed during processing.',503);
  await q("UPDATE organizer_media_assets SET state='ready',mime='video/mp4',byte_length=$2,source_stored_bytes=NULL,reservation_expires_at=NULL,updated_at=now(),version=version+1 WHERE id=$1::uuid",[assetId,size]);
  await q('INSERT INTO blob_store_inventory(store_id,pathname,byte_length,scan_generation) VALUES($1,$2,$3,$4)',[reservation.store_id,head.pathname,size,Number(ledger.generation)+1]);
  await q('UPDATE blob_store_usage SET observed_bytes=observed_bytes+$2,reserved_bytes=reserved_bytes-$3,generation=generation+1,updated_at=now() WHERE store_id=$1',[reservation.store_id,size,reservation.reserved_bytes]);
  await q('DELETE FROM media_upload_reservations WHERE asset_id=$1::uuid',[assetId]);
 });
 return {ready:true,alreadyReady:false};
}
export async function cleanupImageSource({org,assetId,transaction,blob}){
 const row=await transaction(async q=>{const r=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];if(!r||r.state!=='ready'||!r.source_cleanup_pending)return null;if(r.private_blob_path===r.source_blob_path)fail('ASSET_IN_USE','The source image is still referenced.',409);return r;});
 if(!row)return {cleaned:true};
 try{await blob.del(row.source_blob_path);}catch{return {cleaned:false};}
 const stillThere=await blob.headOrNull(row.source_blob_path);if(stillThere)return {cleaned:false};
 await transaction(async q=>{const r=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];if(!r||r.state!=='ready'||!r.source_cleanup_pending)return;const ledger=(await q('SELECT * FROM blob_store_usage WHERE store_id=(SELECT store_id FROM blob_store_inventory WHERE pathname=$1 LIMIT 1) FOR UPDATE',[r.source_blob_path]))[0];if(!ledger)fail('STORAGE_USAGE_UNKNOWN','Shared storage usage is unavailable.',503);const found=(await q('DELETE FROM blob_store_inventory WHERE store_id=$1 AND pathname=$2 RETURNING byte_length',[ledger.store_id,r.source_blob_path]))[0];if(!found)return;await q('UPDATE organizer_media_assets SET source_stored_bytes=0,source_cleanup_pending=false,updated_at=now() WHERE id=$1::uuid',[assetId]);await q('UPDATE blob_store_usage SET observed_bytes=observed_bytes-$2,generation=generation+1,updated_at=now() WHERE store_id=$1',[ledger.store_id,found.byte_length]);});
 return {cleaned:true};
}
export async function deleteV6Asset({org,assetId,expectedVersion,transaction,blob}){
 const claim=await transaction(async q=>{
  const asset=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];
  if(!asset)fail('ASSET_NOT_FOUND','This media item was not found.',404);
  if(asset.state==='deleted')return {deleted:true};
  if(asset.version!==expectedVersion)fail('ASSET_VERSION_CONFLICT','This media item changed. Refresh it.',409);
  const refs=(await q(`SELECT (SELECT count(*)::int FROM organizer_event_asset_refs WHERE organizer_id=$1::uuid AND asset_id=$2::uuid)+(SELECT count(*)::int FROM public_media_refs WHERE organizer_id=$1::uuid AND asset_id=$2::uuid) AS n`,[org,assetId]))[0];
  if(Number(refs.n)>0)fail('ASSET_IN_USE','Remove this media item from its events first.',409);
  if(!['ready','deleting'].includes(asset.state))fail('ASSET_NOT_FOUND','This media item is not ready for deletion.',404);
  const tracked=(await q('SELECT store_id FROM blob_store_inventory WHERE pathname=$1 LIMIT 1',[asset.private_blob_path]))[0];if(!tracked)fail('STORAGE_USAGE_UNKNOWN','Shared storage usage is unavailable.',503);
  if(asset.state==='ready')await q("UPDATE organizer_media_assets SET state='deleting',version=version+1,updated_at=now() WHERE id=$1::uuid",[assetId]);
  return {asset,storeId:tracked.store_id};
 });
 if(claim.deleted)return {deleted:true};
 const paths=[claim.asset.private_blob_path,...(claim.asset.source_blob_path?[claim.asset.source_blob_path]:[])];
 for(const path of paths){try{await blob.del(path);}catch{return {deleted:false,retry:true};}const exists=await blob.headOrNull(path);if(exists)return {deleted:false,retry:true};}
 await transaction(async q=>{
  const asset=(await q('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid FOR UPDATE',[org,assetId]))[0];
  if(!asset||asset.state==='deleted')return;
  if(asset.state!=='deleting')fail('ASSET_VERSION_CONFLICT','This media item changed.',409);
  const refs=(await q(`SELECT (SELECT count(*)::int FROM organizer_event_asset_refs WHERE organizer_id=$1::uuid AND asset_id=$2::uuid)+(SELECT count(*)::int FROM public_media_refs WHERE organizer_id=$1::uuid AND asset_id=$2::uuid) AS n`,[org,assetId]))[0];if(Number(refs.n)>0)fail('ASSET_IN_USE','This media item is in use.',409);
  const ledger=(await q('SELECT * FROM blob_store_usage WHERE store_id=$1 FOR UPDATE',[claim.storeId]))[0];if(!ledger)fail('STORAGE_USAGE_UNKNOWN','Shared storage usage is unavailable.',503);
  const removed=await q('DELETE FROM blob_store_inventory WHERE store_id=$1 AND pathname=ANY($2::text[]) RETURNING byte_length',[claim.storeId,paths]);const bytes=removed.reduce((n,r)=>n+Number(r.byte_length),0);
  await q('UPDATE blob_store_usage SET observed_bytes=observed_bytes-$2,generation=generation+1,updated_at=now() WHERE store_id=$1',[claim.storeId,bytes]);
  await q("UPDATE organizer_media_assets SET state='deleted',source_stored_bytes=0,source_cleanup_pending=false,version=version+1,updated_at=now() WHERE id=$1::uuid",[assetId]);
 });
 return {deleted:true};
}
