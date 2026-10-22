// Server Blob operations resolve Vercel OIDC when BLOB_STORE_ID is connected.
// The SDK falls back to BLOB_READ_WRITE_TOKEN outside that environment.
// This is a configuration check, not proof that credentials are valid.
export function privateBlobConfigured(env=process.env){
 return Boolean(env.BLOB_STORE_ID?.trim()||env.BLOB_READ_WRITE_TOKEN?.trim());
}

// Keep organizer media separate from legacy demo snapshots. Under OIDC the
// explicit storeId selects the media store. A project-connected store may
// also inject a read-write token; fallback is safe only when that token names
// the same media store.
export function liveMediaStoreConfigured(env=process.env){
 const legacy=env.BLOB_STORE_ID?.trim(),media=env.MEDIA_BLOB_STORE_ID?.trim();
 const token=env.BLOB_READ_WRITE_TOKEN?.trim();
 const tokenStore=token?.startsWith('vercel_blob_rw_')?token.split('_')[3]:null;
 return Boolean(legacy&&media&&legacy!==media&&(!token||tokenStore===media.replace(/^store_/,'')));
}

export function liveMediaStoreOptions(env=process.env){
 if(!liveMediaStoreConfigured(env))throw new Error('Live media store is not isolated.');
 return {storeId:env.MEDIA_BLOB_STORE_ID.trim()};
}
