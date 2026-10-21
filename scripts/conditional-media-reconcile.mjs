// A one-time Preview build audit of the connected private Blob store.
// It never exposes credentials or creates a public administration endpoint.
if(process.env.CLICKATICK_RECONCILE_MEDIA_STORE!=='true')process.exit(0);
if(process.env.VERCEL_ENV!=='preview')throw new Error('Private media reconciliation is permitted only in a Vercel preview build.');
if(!process.env.BLOB_STORE_ID||!process.env.MEDIA_BLOB_STORE_ID||process.env.MEDIA_BLOB_STORE_ID===process.env.BLOB_STORE_ID||process.env.BLOB_READ_WRITE_TOKEN)throw new Error('The live media store must be separate from the legacy Blob store and use OIDC.');
if(!process.env.DATABASE_URL)throw new Error('The Preview database is not connected.');
if(process.env.MEDIA_ALL_WRITERS_COORDINATED!=='true')throw new Error('Shared Blob writers have not been coordinated.');

try{
 const {reconcileConnectedMediaStore}=await import('../lib/integrated-phase-a3-media-v6-runtime.mjs');
 const result=await reconcileConnectedMediaStore();
 process.stdout.write(`Private Blob inventory reconciled: ${result.objectCount} objects, ${result.observedBytes} bytes observed, ${result.untrackedBytes} untracked bytes.\n`);
}catch{
 throw new Error('Private Blob reconciliation failed. Check Preview OIDC access, store connection, and database ledger.');
}
