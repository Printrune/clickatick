import {PhaseA1Error} from './integrated-phase-a1.mjs';

const fail=(code,message,status)=>{throw new PhaseA1Error(code,message,status);};

// Invoke from an operator-controlled job. A missing or uncertain Blob never releases a reservation.
export async function recoverExpiredMedia({transaction,blob,limit=20,now=new Date()}){
 if(!Number.isInteger(limit)||limit<1||limit>50)fail('INVALID_INPUT','Check the recovery batch size.',400);
 const candidates=await transaction(q=>q(`SELECT a.id,a.organizer_id FROM media_upload_reservations r JOIN organizer_media_assets a ON a.id=r.asset_id
  WHERE r.expires_at<$1 AND a.state IN ('pending','uploading','verifying','reconciling')
  ORDER BY r.expires_at,a.id LIMIT $2`,[now,limit]));
 const result={checked:0,released:0,needsReview:0,errors:0,assetIds:[]};
 for(const candidate of candidates){
  const claim=await transaction(async q=>{
   const rows=await q(`SELECT a.*,r.store_id,r.reserved_bytes,r.expires_at FROM organizer_media_assets a JOIN media_upload_reservations r ON r.asset_id=a.id
    WHERE a.id=$1::uuid AND a.organizer_id=$2::uuid FOR UPDATE OF a,r`,[candidate.id,candidate.organizer_id]);
   const row=rows[0];if(!row||new Date(row.expires_at)>=now||!['pending','uploading','verifying','reconciling'].includes(row.state))return null;
   if(row.state!=='reconciling')await q("UPDATE organizer_media_assets SET state='reconciling',failure_code='UPLOAD_RECOVERY_PENDING',failure_message='Checking an expired upload.',updated_at=now() WHERE id=$1::uuid",[row.id]);
   return row;
  });
  if(!claim)continue;result.checked++;
  const paths=[...new Set([claim.private_blob_path,claim.source_blob_path].filter(Boolean))];
  let observed=[];try{for(const path of paths){const head=await blob.headOrNull(path);if(head)observed.push({path,size:head.size});}}catch{result.errors++;result.assetIds.push(claim.id);continue;}
  const unsafe=observed.length||claim.state==='verifying'||['UPLOAD_OBJECT_REVIEW','UPLOAD_PROCESS_REVIEW'].includes(claim.failure_code);
  const grace=new Date(claim.expires_at).getTime()>now.getTime()-3600000;
  if(unsafe||grace){
   // Keep the entire reservation charged. The worker cannot infer whether an object
   // belongs to a completed but uncommitted callback or an incomplete upload.
   const code=observed.length||claim.failure_code==='UPLOAD_OBJECT_REVIEW'?'UPLOAD_OBJECT_REVIEW':claim.state==='verifying'||claim.failure_code==='UPLOAD_PROCESS_REVIEW'?'UPLOAD_PROCESS_REVIEW':'UPLOAD_GRACE_PERIOD';
   await transaction(async q=>{const row=(await q('SELECT state FROM organizer_media_assets WHERE id=$1::uuid FOR UPDATE',[claim.id]))[0];if(row?.state==='reconciling')await q("UPDATE organizer_media_assets SET failure_code=$2,failure_message='An expired upload may still have stored data and needs review.',updated_at=now() WHERE id=$1::uuid",[claim.id,code]);});
   result.needsReview++;result.assetIds.push(claim.id);continue;
  }
  const released=await transaction(async q=>{
   const r=(await q('SELECT * FROM media_upload_reservations WHERE asset_id=$1::uuid FOR UPDATE',[claim.id]))[0];
   const a=(await q('SELECT state FROM organizer_media_assets WHERE id=$1::uuid FOR UPDATE',[claim.id]))[0];
   if(!r||!a||a.state!=='reconciling'||new Date(r.expires_at)>=now)return false;
   const ledger=(await q('SELECT * FROM blob_store_usage WHERE store_id=$1 FOR UPDATE',[r.store_id]))[0];
   if(!ledger||Number(ledger.reserved_bytes)<Number(r.reserved_bytes))fail('STORAGE_USAGE_UNKNOWN','Shared storage usage is unavailable.',503);
   await q("UPDATE organizer_media_assets SET state='failed',failure_code='UPLOAD_EXPIRED',failure_message='The upload expired before completion.',updated_at=now() WHERE id=$1::uuid",[claim.id]);
   await q('UPDATE blob_store_usage SET reserved_bytes=reserved_bytes-$2,generation=generation+1,updated_at=now() WHERE store_id=$1',[r.store_id,r.reserved_bytes]);
   await q('DELETE FROM media_upload_reservations WHERE asset_id=$1::uuid',[claim.id]);return true;
  });
  if(released){result.released++;result.assetIds.push(claim.id);}else result.needsReview++;
 }
 return result;
}
