// Server Blob operations resolve Vercel OIDC when BLOB_STORE_ID is connected.
// The SDK falls back to BLOB_READ_WRITE_TOKEN outside that environment.
// This is a configuration check, not proof that credentials are valid.
export function privateBlobConfigured(env=process.env){
 return Boolean(env.BLOB_STORE_ID?.trim()||env.BLOB_READ_WRITE_TOKEN?.trim());
}

// Keep the new organizer media store separate from legacy demo snapshots.
// Explicit storeId selects the media store under OIDC. A legacy read-write
// token could silently override that choice, so fail closed when present.
export function liveMediaStoreConfigured(env=process.env){
 const legacy=env.BLOB_STORE_ID?.trim(),media=env.MEDIA_BLOB_STORE_ID?.trim();
 return Boolean(legacy&&media&&legacy!==media&&!env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function liveMediaStoreOptions(env=process.env){
 if(!liveMediaStoreConfigured(env))throw new Error('Live media store is not isolated.');
 return {storeId:env.MEDIA_BLOB_STORE_ID.trim()};
}
