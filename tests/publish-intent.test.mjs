import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyListing} from '../lib/listing.mjs';
import {publicationIntent,savedPublishIntent,checkoutIntent,publishedListingPath} from '../lib/publish-intent.mjs';
const first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';
test('canonical reviewed snapshot reuses its independent key after uncertain response or reload',async()=>{
 const draft=emptyListing();draft.title='Demo walk';const intent=await publicationIntent(draft,null,()=>first),restored=savedPublishIntent(JSON.parse(JSON.stringify(intent)));
 assert.equal(intent.id,first);assert.equal(intent.fingerprint.length,64);assert.deepEqual(await publicationIntent(structuredClone(draft),restored,()=>{throw Error('Must not create another identifier');}),intent);
});
test('changed reviewed content gets a new publish key without resetting organiser details',async()=>{
 const draft=emptyListing();draft.title='Demo walk';draft.setup.restrictions='Adults only';const intent=await publicationIntent(draft,null,()=>first),edited={...draft,title:'Updated demo walk'};
 const next=await publicationIntent(edited,intent,()=>second);assert.equal(next.id,second);assert.notEqual(next.fingerprint,intent.fingerprint);assert.equal(edited.setup.restrictions,'Adults only');assert.equal(draft.title,'Demo walk');
});
test('photos and exact meeting pin participate in immutable snapshot identity',async()=>{
 const draft=emptyListing();draft.setup.business={address:'100 Demo Way',lat:'33.4484',lng:'-112.074',photo:{name:'demo.png',mime:'image/png',dataUrl:'data:image/png;base64,YQ=='}};
 const intent=await publicationIntent(draft,null,()=>first),changed=structuredClone(draft);changed.setup.business.lat='33.4485';
 assert.equal((await publicationIntent(changed,intent,()=>second)).id,second);assert.equal(draft.setup.business.photo.dataUrl,'data:image/png;base64,YQ==');
});
test('checkout intent persists for identical selection and changes with basket content',()=>{
 const content={occurrence:'2026-10-29T19:00',items:[{tierId:'general',quantity:2}],acknowledged:true},intent=checkoutIntent(content,null,()=>first);
 assert.deepEqual(checkoutIntent(content,JSON.parse(JSON.stringify(intent)),()=>second),intent);
 assert.equal(checkoutIntent({...content,items:[{tierId:'general',quantity:3}]},intent,()=>second).id,second);
 assert.equal(savedPublishIntent({id:'bad',fingerprint:'x'}),null);
});

test('publication redirect accepts only the exact relative listing UUID path',()=>{
 const path='/listing/'+first;assert.equal(publishedListingPath(path),path);
 for(const invalid of ['https://example.com'+path,'//example.com'+path,path+'?next=elsewhere',path+'#section',path+'\n','/listing/../'+first,'/listing/%2e%2e/'+first,'/listing/123',path.replace('/listing/','/receipt/'),undefined])assert.throws(()=>publishedListingPath(invalid),/listing link/);
});
test('creator capability survives uncertain publish reload and changes only with a new publication',async()=>{
 const draft=emptyListing();draft.title='Demo';const token='a'.repeat(64),intent=await publicationIntent(draft,null,()=>first,()=>token);
 assert.equal(intent.creatorToken,token);assert.deepEqual(await publicationIntent(draft,savedPublishIntent(JSON.parse(JSON.stringify(intent))),()=>second,()=>{throw Error('Do not replace creator access on retry');}),intent);
 const next=await publicationIntent({...draft,title:'Changed'},intent,()=>second,()=>'b'.repeat(64));assert.equal(next.creatorToken,'b'.repeat(64));assert.equal(next.id,second);
 const legacy={id:intent.id,fingerprint:intent.fingerprint};const upgraded=await publicationIntent(draft,legacy,()=>second,()=>'c'.repeat(64));assert.equal(upgraded.id,second);assert.equal(upgraded.creatorToken,'c'.repeat(64));assert.equal(legacy.id,first);
 assert.equal(savedPublishIntent({...intent,creatorToken:['a'.repeat(64)]}),null);
});
