import {scanEntireStore} from './integrated-phase-a3-media-v6-core.mjs';
import {PhaseA1Error} from './integrated-phase-a1.mjs';
const fail=(code,message,status)=>{throw new PhaseA1Error(code,message,status);};
export async function reconcileBlobStore({storeId,listPage,transaction,allWritersCoordinated}){
 if(!allWritersCoordinated||typeof storeId!=='string'||!storeId)fail('STORAGE_USAGE_UNKNOWN','Shared storage writers are not coordinated.',503);
 const scan=await scanEntireStore(listPage);
 return transaction(async q=>{
  await q("INSERT INTO blob_store_usage(store_id,reconciliation_status) VALUES($1,'unknown') ON CONFLICT(store_id) DO NOTHING",[storeId]);
  const ledger=(await q('SELECT * FROM blob_store_usage WHERE store_id=$1 FOR UPDATE',[storeId]))[0];
  if(Number(ledger.reserved_bytes)>0)fail('STORAGE_USAGE_UNKNOWN','Storage has unresolved upload reservations.',503);
  const rows=await q(`SELECT private_blob_path,source_blob_path,state,media_type FROM organizer_media_assets WHERE state<>'deleted'`);
  const known=new Set();let missingReady=false;
  for(const row of rows){if(row.private_blob_path)known.add(row.private_blob_path);if(row.source_blob_path)known.add(row.source_blob_path);if(['ready','deleting'].includes(row.state)&&!scan.paths.has(row.private_blob_path))missingReady=true;}
  if(missingReady)fail('STORAGE_USAGE_UNKNOWN','A retained media object is missing.',503);
  let untrackedBytes=0;for(const [path,size] of scan.paths)if(!known.has(path))untrackedBytes+=size;
  await q('DELETE FROM blob_store_inventory WHERE store_id=$1',[storeId]);
  const generation=Number(ledger.generation)+1;
  for(const [path,size] of scan.paths)await q('INSERT INTO blob_store_inventory(store_id,pathname,byte_length,scan_generation) VALUES($1,$2,$3,$4)',[storeId,path,size,generation]);
  await q("UPDATE blob_store_usage SET observed_bytes=$2,untracked_bytes=$3,reserved_bytes=0,last_full_scan_at=now(),reconciliation_status='ready',generation=$4,updated_at=now() WHERE store_id=$1",[storeId,scan.observedBytes,untrackedBytes,generation]);
  return {observedBytes:scan.observedBytes,untrackedBytes,objectCount:scan.paths.size,generation};
 });
}
