import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readBoundedImage,verifyServerImageIntent,MAX_SERVER_IMAGE_BYTES} from '../lib/private-image-upload.mjs';

const id=randomUUID(),user='owner';
const asset=(overrides={})=>({media_type:'image',upload_id:id,upload_subject:user,source_mime:'image/png',source_bytes:3,state:'pending',reservation_expires_at:new Date(Date.now()+60000),...overrides});
const req=(body,headers={})=>new Request('https://example.test/upload',{method:'POST',headers,body});

test('server image upload validates ownership, reservation, type, size, and replay',()=>{
 assert.equal(verifyServerImageIntent(asset(),{uploadId:id,user,mime:'image/png'}),'pending');
 assert.equal(verifyServerImageIntent(asset({state:'ready'}),{uploadId:id,user,mime:'image/png'}),'ready');
 assert.throws(()=>verifyServerImageIntent(asset(),{uploadId:randomUUID(),user,mime:'image/png'}),{code:'ASSET_NOT_FOUND'});
 assert.throws(()=>verifyServerImageIntent(asset(),{uploadId:id,user:'other',mime:'image/png'}),{code:'ASSET_NOT_FOUND'});
 assert.throws(()=>verifyServerImageIntent(asset(),{uploadId:id,user,mime:'image/jpeg'}),{code:'UNSUPPORTED_MEDIA_FORMAT'});
 assert.throws(()=>verifyServerImageIntent(asset({reservation_expires_at:new Date(0)}),{uploadId:id,user,mime:'image/png'}),{code:'UPLOAD_EXPIRED'});
 assert.throws(()=>verifyServerImageIntent(asset({source_bytes:MAX_SERVER_IMAGE_BYTES+1}),{uploadId:id,user,mime:'image/png'}),{code:'BODY_TOO_LARGE'});
});

test('streaming image read checks bytes even without Content-Length',async()=>{
 assert.deepEqual(await readBoundedImage(req('abc'),3),Buffer.from('abc'));
 await assert.rejects(readBoundedImage(req('ab'),3),{code:'UPLOAD_VERIFICATION_FAILED'});
 await assert.rejects(readBoundedImage(req('abcd'),3),{code:'UPLOAD_VERIFICATION_FAILED'});
 await assert.rejects(readBoundedImage(req('abc',{'content-length':'2'}),3),{code:'UPLOAD_VERIFICATION_FAILED'});
 await assert.rejects(readBoundedImage(req('abc',{'content-length':String(MAX_SERVER_IMAGE_BYTES+1)}),3),{code:'BODY_TOO_LARGE'});
});
