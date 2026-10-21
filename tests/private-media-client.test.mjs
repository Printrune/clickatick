import test from 'node:test';
import assert from 'node:assert/strict';
import {rememberCreatorImages,recoverCreatorImage,rememberPendingAttach,readPendingAttach,clearPendingAttach,uploadIntent,clearUploadIntent} from '../lib/private-media-client.mjs';

const first='123e4567-e89b-42d3-a456-426614174000',second='123e4567-e89b-42d3-a456-426614174001',third='123e4567-e89b-42d3-a456-426614174002';
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
const source={id:first,draft:{setup:{business:{photo:{dataUrl:'data:image/png;base64,QUJD'}},eventLocation:{photo:null}},coverImage:{dataUrl:'data:image/jpeg;base64,REVG'}}};

test('local image recovery requires the same source ID and slot digest',async()=>{
 storage.clear();localStorage.setItem('ticketnest-draft',JSON.stringify(source));
 assert.equal(await rememberCreatorImages(second,third,source),true);
 const recovered=await recoverCreatorImage(second,third,'business');
 assert.equal(recovered.name,'saved-business.png');
 assert.equal(recovered.type,'image/png');
 assert.equal(await recovered.text(),'ABC');
 const changed={...source,draft:{...source.draft,setup:{...source.draft.setup,business:{photo:{dataUrl:'data:image/png;base64,R0hJ'}}}}};
 localStorage.setItem('ticketnest-draft',JSON.stringify(changed));
 assert.equal(await recoverCreatorImage(second,third,'business'),null);
 assert.equal(await (await recoverCreatorImage(second,third,'cover')).text(),'DEF');
 localStorage.setItem('ticketnest-draft',JSON.stringify({...source,id:third}));
 assert.equal(await recoverCreatorImage(second,third,'cover'),null);
});

test('pending attachment keeps an uploaded asset ID for retry, then clears it',()=>{
 storage.clear();rememberPendingAttach(second,third,'cover',first);
 assert.equal(readPendingAttach(second,third,'cover'),first);
 clearPendingAttach(second,third,'cover');
 assert.equal(readPendingAttach(second,third,'cover'),null);
});

test('upload retry key survives a repeated file selection but changes with image or description',async()=>{
 storage.clear();const firstFile=new File(['same bytes'],'first.png',{type:'image/png'}),renamed=new File(['same bytes'],'renamed.png',{type:'image/png'}),different=new File(['other bytes'],'first.png',{type:'image/png'});
 const key=await uploadIntent(second,third,'business',firstFile,'Entrance');
 assert.equal(await uploadIntent(second,third,'business',renamed,'Entrance'),key);
 assert.notEqual(await uploadIntent(second,third,'business',different,'Entrance'),key);
 const newKey=await uploadIntent(second,third,'business',firstFile,'Entrance');
 assert.notEqual(newKey,key);
 clearUploadIntent(second,third,'business');
 assert.notEqual(await uploadIntent(second,third,'business',firstFile,'Entrance'),newKey);
});
