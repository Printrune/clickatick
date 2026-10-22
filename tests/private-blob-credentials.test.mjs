import test from 'node:test';
import assert from 'node:assert/strict';
import {privateBlobConfigured,liveMediaStoreConfigured,liveMediaStoreOptions} from '../lib/private-blob-credentials.mjs';

test('private Blob server operations accept connected store OIDC or token fallback',()=>{
 assert.equal(privateBlobConfigured({BLOB_STORE_ID:'store_example'}),true);
 assert.equal(privateBlobConfigured({BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_example'}),true);
 assert.equal(privateBlobConfigured({BLOB_STORE_ID:' ',BLOB_READ_WRITE_TOKEN:''}),false);
});

test('live organizer media cannot use the legacy store or a legacy token fallback',()=>{
 const isolated={BLOB_STORE_ID:'store_legacy',MEDIA_BLOB_STORE_ID:'store_live'};
 assert.equal(liveMediaStoreConfigured(isolated),true);
 assert.deepEqual(liveMediaStoreOptions(isolated),{storeId:'store_live'});
 assert.equal(liveMediaStoreConfigured({...isolated,MEDIA_BLOB_STORE_ID:'store_legacy'}),false);
 assert.equal(liveMediaStoreConfigured({...isolated,BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_live_secret'}),true);
 assert.equal(liveMediaStoreConfigured({...isolated,BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_legacy_secret'}),false);
 assert.equal(liveMediaStoreConfigured({...isolated,BLOB_READ_WRITE_TOKEN:'legacy-token'}),false);
 assert.throws(()=>liveMediaStoreOptions({...isolated,MEDIA_BLOB_STORE_ID:'store_legacy'}),/not isolated/);
});
