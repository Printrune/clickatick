import {PhaseA1Error} from './integrated-phase-a1.mjs';
import {clerkSubject} from './integrated-phase-a1-runtime.mjs';
import {mediaAssetSummary,mediaCapabilities,mediaUsageProjection,scanEntireStore} from './integrated-phase-a3-media-v6-core.mjs';
import {encodeCursor,decodeCursor,parsePublicId} from './integrated-phase-a4.mjs';
import {liveMediaStoreConfigured,liveMediaStoreOptions} from './private-blob-credentials.mjs';
const fail=(code,message,status)=>{throw new PhaseA1Error(code,message,status);};
const gate=()=>{if(!process.env.CLERK_SECRET_KEY||!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)fail('AUTH_UNAVAILABLE','Organizer sign-in is not connected yet.',503);if(!process.env.DATABASE_URL)fail('DATABASE_UNAVAILABLE','Organizer storage is not connected yet.',503);};
async function query(text,params=[]){try{const {neon}=await import('@neondatabase/serverless');return await neon(process.env.DATABASE_URL).query(text,params);}catch{fail('DATABASE_UNAVAILABLE','Organizer storage is unavailable.',503);}}
async function context(org){parsePublicId(org,'organizerId');gate();let user;try{user=await clerkSubject();}catch{fail('AUTH_UNAVAILABLE','Organizer sign-in is unavailable.',503);}if(!user)fail('SIGN_IN_REQUIRED','Sign in to manage media.',401);const rows=await query('SELECT o.status AS brand_status,m.status AS member_status,m.role FROM organizers o JOIN organizer_members m ON m.organizer_id=o.id WHERE o.id=$1::uuid AND m.clerk_user_id=$2',[org,user]);const m=rows[0];if(!m||m.brand_status!=='active')fail('BRAND_NOT_FOUND','This brand was not found.',404);if(m.member_status!=='active')fail('MEMBERSHIP_DISABLED','Your access is disabled.',403);return {...m,user};}
async function usage(org){await context(org);const connected=process.env.MEDIA_V6_CONNECTED_VERIFIED==='true'&&process.env.MEDIA_ALL_WRITERS_COORDINATED==='true'&&liveMediaStoreConfigured();let ledger=process.env.MEDIA_BLOB_STORE_ID?await query('SELECT * FROM blob_store_usage WHERE store_id=$1',[process.env.MEDIA_BLOB_STORE_ID]):[];if(connected&&process.env.MEDIA_V6_IMAGE_UPLOAD_ENABLED==='true'&&(!ledger[0]?.last_full_scan_at||Date.now()-new Date(ledger[0].last_full_scan_at).getTime()>=60000)){await reconcileConnectedMediaStore();ledger=await query('SELECT * FROM blob_store_usage WHERE store_id=$1',[process.env.MEDIA_BLOB_STORE_ID]);}const counts=await query("SELECT count(*) FILTER (WHERE media_type='image' AND state IN ('pending','uploading','verifying','reconciling','ready','deleting'))::int AS image_count,count(*) FILTER (WHERE media_type='video' AND state IN ('pending','uploading','verifying','reconciling','ready','deleting'))::int AS video_count FROM organizer_media_assets WHERE organizer_id=$1::uuid",[org]);const projection=mediaUsageProjection(ledger[0],counts[0]),fresh=projection.storageStatus==='ready',image=fresh&&connected&&process.env.MEDIA_V6_IMAGE_UPLOAD_ENABLED==='true',video=false,playback=connected&&process.env.MEDIA_V6_VIDEO_PLAYBACK_ENABLED==='true';return {usage:projection,capabilities:mediaCapabilities(image||video||playback?null:'CONNECTED_VERIFICATION_PENDING',image,video,playback)};}
export async function mediaV6Usage(org){return usage(org);}
export async function mediaV6List(org,params){const summary=await usage(org),raw=params.get('limit'),limit=raw===null?20:Number(raw);if(!Number.isInteger(limit)||limit<1||limit>50)fail('INVALID_INPUT','Check the page size.',400);const mediaType=params.get('mediaType'),state=params.get('state');if(mediaType&&!['image','video'].includes(mediaType)||state&&!['pending','uploading','verifying','reconciling','ready','failed','deleting','deleted'].includes(state))fail('INVALID_INPUT','Check the media filter.',400);const scope=`media:${org}:${mediaType||'*'}:${state||'*'}`,cursor=decodeCursor(params.get('cursor'),scope);const rows=await query(`SELECT a.*,coalesce((SELECT count(*)::int FROM organizer_event_asset_refs d WHERE d.organizer_id=a.organizer_id AND d.asset_id=a.id),0)+coalesce((SELECT count(*)::int FROM public_media_refs p WHERE p.organizer_id=a.organizer_id AND p.asset_id=a.id),0) AS reference_count FROM organizer_media_assets a WHERE a.organizer_id=$1::uuid AND ($2::text IS NULL OR a.media_type=$2) AND ($3::text IS NULL AND a.state<>'deleted' OR a.state=$3) AND ($4::timestamptz IS NULL OR (a.created_at,a.id)<($4::timestamptz,$5::uuid)) ORDER BY a.created_at DESC,a.id DESC LIMIT $6`,[org,mediaType,state,cursor?.[0]||null,cursor?.[1]||null,limit+1]);const selected=rows.slice(0,limit),last=selected.at(-1);return {assets:selected.map(mediaAssetSummary),nextCursor:rows.length>limit?encodeCursor({scope,position:[new Date(last.created_at).toISOString(),last.id]}):null,...summary};}
export async function mediaV6Status(org,id){parsePublicId(id,'assetId');const summary=await usage(org);const rows=await query(`SELECT a.*,coalesce((SELECT count(*)::int FROM organizer_event_asset_refs d WHERE d.organizer_id=a.organizer_id AND d.asset_id=a.id),0)+coalesce((SELECT count(*)::int FROM public_media_refs p WHERE p.organizer_id=a.organizer_id AND p.asset_id=a.id),0) AS reference_count FROM organizer_media_assets a WHERE a.organizer_id=$1::uuid AND a.id=$2::uuid`,[org,id]);if(!rows.length)fail('ASSET_NOT_FOUND','This media item was not found.',404);return {asset:mediaAssetSummary(rows[0]),...summary};}
export async function mediaV6IntentsUnavailable(){fail('MEDIA_UNAVAILABLE','Direct media uploads await connected storage verification.',503);}
export async function mediaV6ClientUploadUnavailable(){fail('MEDIA_UNAVAILABLE','Direct media uploads await connected storage verification.',503);}
export async function scanConnectedPrivateStore(){
 if(process.env.MEDIA_ALL_WRITERS_COORDINATED!=='true'||!liveMediaStoreConfigured())fail('STORAGE_USAGE_UNKNOWN','Shared storage cannot be fully accounted yet.',503);
 const {list}=await import('@vercel/blob');return scanEntireStore(options=>list({...options,...liveMediaStoreOptions()}));
}
import {readBody,originMatches} from './integrated-phase-a1.mjs';
import {parseMediaIntent,reserveMediaIntentTx,tokenOptionsForAsset,intentProjection} from './integrated-phase-a3-media-v6-write.mjs';
import {processCompletedImage,processCompletedVideo} from './integrated-phase-a3-media-v6-process.mjs';
import {recoverExpiredMedia} from './integrated-phase-a3-media-v6-recovery.mjs';
import {servePrivateVideo} from './integrated-phase-a3-media-v6-video-response.mjs';
import {reconcileBlobStore} from './integrated-phase-a3-media-v6-ledger.mjs';
import {readBoundedImage,verifyServerImageIntent} from './private-image-upload.mjs';

const uploadGate=(type='image')=>{if(process.env.MEDIA_V6_CONNECTED_VERIFIED!=='true'||process.env[type==='video'?'MEDIA_V6_VIDEO_UPLOAD_ENABLED':'MEDIA_V6_IMAGE_UPLOAD_ENABLED']!=='true'||process.env.MEDIA_ALL_WRITERS_COORDINATED!=='true'||!liveMediaStoreConfigured()||type==='video')fail('MEDIA_UNAVAILABLE','Media uploads await connected storage verification.',503);};
const writeTx=async action=>{const {Pool}=await import('@neondatabase/serverless');const pool=new Pool({connectionString:process.env.DATABASE_URL});let client;try{client=await pool.connect();await client.query('BEGIN');const q=async(text,params=[])=>(await client.query(text,params)).rows;const value=await action(q);await client.query('COMMIT');return value;}catch(error){if(client)await client.query('ROLLBACK');throw error;}finally{client?.release();await pool.end();}};
const blobAdapter=async()=>{const api=await import('@vercel/blob'),store=liveMediaStoreOptions();return {head:path=>api.head(path,store),async headOrNull(path){try{return await api.head(path,store);}catch(error){if(error?.name==='BlobNotFoundError'||error?.status===404)return null;throw error;}},get:path=>api.get(path,{access:'private',useCache:false,...store}),put:(path,bytes,{contentType})=>api.put(path,bytes,{access:'private',contentType,addRandomSuffix:false,allowOverwrite:false,...store}),async del(path){try{return await api.del(path,store);}catch(error){if(error?.name==='BlobNotFoundError'||error?.status===404)return;throw error;}}};};
export async function mediaV6CreateIntent(org,request){const m=await context(org);if(m.role!=='owner')fail('FORBIDDEN','Only the brand owner can upload media.',403);const input=parseMediaIntent(await readBody(request));uploadGate(input.mediaType);const summary=await usage(org);if(summary.usage.storageStatus!=='ready')fail('STORAGE_USAGE_UNKNOWN','Shared storage usage is unavailable.',503);const claim=await writeTx(q=>reserveMediaIntentTx(q,{org,user:m.user,storeId:process.env.MEDIA_BLOB_STORE_ID,input,allWritersCoordinated:true}));return intentProjection(claim.asset,org,summary.usage,summary.capabilities);}
export async function mediaV6ServerImageUpload(org,id,request){
 parsePublicId(org,'organizerId');parsePublicId(id,'assetId');uploadGate('image');
 if(!originMatches(request))fail('WRONG_ORIGIN','Please use the clickatick website.',403);
 const member=await context(org);if(member.role!=='owner')fail('FORBIDDEN','Only the brand owner can upload media.',403);
 const uploadId=request.headers.get('x-upload-id');parsePublicId(uploadId,'uploadId');
 const mime=request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
 const asset=(await query('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid',[org,id]))[0];
 const state=verifyServerImageIntent(asset,{uploadId,user:member.user,mime});
 if(state==='ready')return {asset:mediaAssetSummary({...asset,reference_count:0})};
 const bytes=await readBoundedImage(request,Number(asset.source_bytes));
 const blob=await blobAdapter();
 try{await blob.put(asset.source_blob_path,bytes,{contentType:mime});}
 catch(error){const existing=await blob.headOrNull(asset.source_blob_path);if(!existing||existing.size!==bytes.length||existing.contentType!==mime)fail('MEDIA_UNAVAILABLE','The image upload could not be confirmed. Retry the upload.',503);}
 try{await processCompletedImage({org,assetId:id,transaction:writeTx,blob});}
 catch(error){if(error instanceof PhaseA1Error)throw error;fail('MEDIA_UNAVAILABLE','The image is still being processed. Check its status.',503);}
 const ready=(await query('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid',[org,id]))[0];
 if(ready?.state!=='ready')fail('MEDIA_UNAVAILABLE','The image is still being processed. Check its status.',503);
 return {asset:mediaAssetSummary({...ready,reference_count:0})};
}
export async function mediaV6ClientUpload(org,request){
 if(!liveMediaStoreConfigured())fail('MEDIA_UNAVAILABLE','Direct media uploads are unavailable for this private store.',503);
 if(process.env.MEDIA_V6_CONNECTED_VERIFIED!=='true'||process.env.MEDIA_ALL_WRITERS_COORDINATED!=='true'||!process.env.MEDIA_BLOB_STORE_ID||!process.env.BLOB_READ_WRITE_TOKEN)fail('MEDIA_UNAVAILABLE','Direct media uploads await connected storage verification.',503);parsePublicId(org,'organizerId');
 const size=Number(request.headers.get('content-length')||0);if(size>16384)fail('INVALID_INPUT','The upload request is too large.',400);
 const text=await request.text();if(text.length>16384)fail('INVALID_INPUT','The upload request is too large.',400);let body;try{body=JSON.parse(text);}catch{fail('INVALID_INPUT','Check the upload request.',400);}
 const {handleUpload}=await import('@vercel/blob/client');
 return handleUpload({request,body,token:process.env.BLOB_READ_WRITE_TOKEN,
  onBeforeGenerateToken:async(pathname,clientPayload)=>{
   if(!originMatches(request))fail('WRONG_ORIGIN','Please use the clickatick website.',403);
   const member=await context(org);if(member.role!=='owner')fail('FORBIDDEN','Only the brand owner can upload media.',403);
   let claim;try{claim=JSON.parse(clientPayload||'');}catch{fail('INVALID_INPUT','Check the upload request.',400);}
   if(!claim||typeof claim.assetId!=='string'||typeof claim.uploadId!=='string')fail('INVALID_INPUT','Check the upload request.',400);
   parsePublicId(claim.assetId,'assetId');parsePublicId(claim.uploadId,'uploadId');
   const row=(await query('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid AND upload_id=$3::uuid AND upload_subject=$4',[org,claim.assetId,claim.uploadId,member.user]))[0];
   if(!row)fail('UPLOAD_EXPIRED','This upload is unavailable.',410);uploadGate(row.media_type);
   return tokenOptionsForAsset(row,pathname);
  },
  onUploadCompleted:async({blob,tokenPayload})=>{
   let claim;try{claim=JSON.parse(tokenPayload||'');}catch{fail('UPLOAD_VERIFICATION_FAILED','The upload callback is invalid.',422);}
   if(claim?.organizerId!==org||typeof claim.assetId!=='string')fail('UPLOAD_VERIFICATION_FAILED','The upload callback is invalid.',422);
   parsePublicId(claim.assetId,'assetId');
   const row=(await query('SELECT media_type,source_blob_path,private_blob_path FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid',[org,claim.assetId]))[0];
   if(!row||blob?.pathname!==(row.media_type==='video'?row.private_blob_path:row.source_blob_path))fail('UPLOAD_VERIFICATION_FAILED','The upload callback path is invalid.',422);uploadGate(row.media_type);
   await (row.media_type==='video'?processCompletedVideo:processCompletedImage)({org,assetId:claim.assetId,transaction:writeTx,blob:await blobAdapter()});
  }
 });
}
export async function reconcileConnectedMediaStore(){
 if(process.env.MEDIA_ALL_WRITERS_COORDINATED!=='true'||!liveMediaStoreConfigured())fail('STORAGE_USAGE_UNKNOWN','Shared storage cannot be reconciled yet.',503);
 const {list}=await import('@vercel/blob');
 return reconcileBlobStore({storeId:process.env.MEDIA_BLOB_STORE_ID,listPage:options=>list({...options,...liveMediaStoreOptions()}),transaction:writeTx,allWritersCoordinated:true});
}
export async function recoverConnectedMediaStore({limit=20}={}){
 if(process.env.MEDIA_V6_CONNECTED_VERIFIED!=='true'||process.env.MEDIA_ALL_WRITERS_COORDINATED!=='true'||!liveMediaStoreConfigured())fail('MEDIA_UNAVAILABLE','Media recovery awaits connected storage verification.',503);
 return recoverExpiredMedia({transaction:writeTx,blob:await blobAdapter(),limit});
}
export async function mediaV6Delete(org,id,request){
 if(process.env.MEDIA_V6_CONNECTED_VERIFIED!=='true'||!liveMediaStoreConfigured())fail('MEDIA_UNAVAILABLE','Private media deletion awaits connected storage verification.',503);
 const m=await context(org);if(m.role!=='owner')fail('FORBIDDEN','Only the brand owner can delete media.',403);
 parsePublicId(id,'assetId');const body=await readBody(request);if(!body||Object.keys(body).length!==1||body.confirmDelete!==true)fail('INVALID_INPUT','Confirm the media deletion.',400);
 const match=request.headers.get('if-match');if(!/^"[1-9]\d*"$/.test(match||''))fail('INVALID_INPUT','Refresh this media item before deleting.',400);
 const {deleteV6Asset}=await import('./integrated-phase-a3-media-v6-process.mjs');
 const result=await deleteV6Asset({org,assetId:id,expectedVersion:Number(match.slice(1,-1)),transaction:writeTx,blob:await blobAdapter()});
 if(!result.deleted)fail('ASSET_DELETE_PENDING','This media item is still being deleted. Retry from the library.',503);
 return null;
}
export async function mediaV6PrivateVideo(org,id,request){
 if(process.env.MEDIA_V6_CONNECTED_VERIFIED!=='true'||process.env.MEDIA_V6_VIDEO_PLAYBACK_ENABLED!=='true'||!liveMediaStoreConfigured())fail('VIDEO_UNAVAILABLE','Private video playback is not connected yet.',503);
 parsePublicId(id,'assetId');await context(org);
 const row=(await query('SELECT * FROM organizer_media_assets WHERE organizer_id=$1::uuid AND id=$2::uuid AND media_type=$3 AND state=$4',[org,id,'video','ready']))[0];if(!row)fail('ASSET_NOT_FOUND','This video was not found.',404);
 const {head,get}=await import('@vercel/blob'),store=liveMediaStoreOptions();return servePrivateVideo({method:request.method,range:request.headers.get('range'),asset:row,head:path=>head(path,store),get:(path,options)=>get(path,{access:'private',useCache:false,...options,...store})});
}
