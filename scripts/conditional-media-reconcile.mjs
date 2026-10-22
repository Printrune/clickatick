// A one-time Preview build audit of the connected private Blob store.
// It never exposes credentials or creates a public administration endpoint.
if(process.env.CLICKATICK_RECONCILE_MEDIA_STORE!=='true')process.exit(0);
if(process.env.VERCEL_ENV!=='preview')throw new Error('Private media reconciliation is permitted only in a Vercel preview build.');
const {liveMediaStoreConfigured,liveMediaStoreOptions}=await import('../lib/private-blob-credentials.mjs');
if(!liveMediaStoreConfigured())throw new Error('The live media store must be separate from the legacy Blob store, and any fallback token must target the media store.');
if(!process.env.DATABASE_URL)throw new Error('The Preview database is not connected.');
if(process.env.MEDIA_ALL_WRITERS_COORDINATED!=='true')throw new Error('Shared Blob writers have not been coordinated.');

try{
 const {randomUUID}=await import('node:crypto');
 const {put,get,del}=await import('@vercel/blob');
 const path=`ops/preview-smoke-${randomUUID()}.txt`,bytes=Buffer.from('clickatick private media check'),options=liveMediaStoreOptions();
 let written=false;
 try{
  await put(path,bytes,{access:'private',contentType:'text/plain',addRandomSuffix:false,allowOverwrite:false,...options});
  written=true;
  const object=await get(path,{access:'private',useCache:false,...options});
  const received=object?.stream?Buffer.from(await new Response(object.stream).arrayBuffer()):null;
  if(!received?.equals(bytes))throw new Error('Private Blob read did not match the temporary write.');
 }finally{if(written)await del(path,options);}
 const {reconcileConnectedMediaStore}=await import('../lib/integrated-phase-a3-media-v6-runtime.mjs');
 const result=await reconcileConnectedMediaStore();
 process.stdout.write(`Private Blob write, read, and delete verified. Inventory reconciled: ${result.objectCount} objects, ${result.observedBytes} bytes observed, ${result.untrackedBytes} untracked bytes.\n`);
}catch{
 throw new Error('Private Blob write/read/delete or reconciliation failed. Check Preview credentials, store connection, and database ledger.');
}
