import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {emptyListing,parseListing,publicationErrors} from '../lib/listing.mjs';
import {emptySetup,parseSetup,effectiveLocation,toAIListing,mergeAIDraft,mapLinks,referralSplit} from '../lib/setup.mjs';
import {answerSchema} from '../lib/claude-ai.mjs';
const photo={name:'venue.png',mime:'image/png',dataUrl:'data:image/png;base64,aGVsbG8='};
const sample=()=>({...emptyListing(),setup:{...emptySetup(),business:{address:'Main entrance',lat:'40.1',lng:'-74.2',photo},restrictions:'Adults only',disclaimer:'Please follow the guide.',disclaimerReviewed:true,referrals:{enabled:true,percentage:'10'},paymentPreferences:['card','bitcoin']}});
test('legacy defaults and configured draft JSON roundtrip preserve complete setup',()=>{
 const old=emptyListing();delete old.setup;assert.deepEqual(parseListing(old).setup,emptySetup());
 const draft=parseListing(sample());assert.deepEqual(parseListing(JSON.parse(JSON.stringify(draft))),draft);assert.equal(draft.location,'Main entrance');
});
test('same location derives effective pin without deleting separate event location',()=>{
 const s=sample().setup;s.eventLocation={address:'Event entrance',lat:'41',lng:'-73',photo:null};
 assert.equal(effectiveLocation(s).address,'Main entrance');s.sameLocation=false;assert.equal(effectiveLocation(parseSetup(s)).address,'Event entrance');
});
test('untrusted setup has bounded coordinates, text, numeric rewards and photo formats',()=>{
 for(const change of [{business:{...sample().setup.business,lat:'91'}},{business:{...sample().setup.business,lng:'Infinity'}},{restrictions:'x'.repeat(4001)},{referrals:{enabled:true,percentage:'91'}},{paymentPreferences:['cash']},{business:{...sample().setup.business,photo:{...photo,mime:'image/svg+xml'}}},{business:{...sample().setup.business,photo:{...photo,dataUrl:'https://untrusted.invalid'}}}])assert.throws(()=>parseSetup({...sample().setup,...change}));
 const s=parseSetup({...sample().setup,unknown:'discard',paymentPreferences:['card','card']});assert.equal(s.unknown,undefined);assert.deepEqual(s.paymentPreferences,['card']);
});
test('shared inventory retains total while allocated legacy inventory sums categories',()=>{
 const tier={id:'a1111111-1111-4111-8111-111111111111',name:'Adult',description:'',price:'20',quantity:'5'};
 const draft={...emptyListing(),capacity:'20',ticketTiers:[tier]};assert.equal(parseListing(draft).capacity,'5');
 draft.setup.inventoryMode='shared';assert.equal(parseListing(draft).capacity,'20');assert.equal(parseListing({...draft,ticketTiers:[{...tier,quantity:''}]}).capacity,'20');
});
test('venue photos never enter AI payload; omitted or null patches preserve organiser edits',()=>{
 const previous=sample(),safe=toAIListing(previous);assert.equal(safe.setup.business.photo,null);assert.ok(!JSON.stringify(safe).includes(photo.dataUrl));assert.deepEqual(previous.setup.business.photo,photo);
 const omitted={...emptyListing(),title:'New title'};delete omitted.setup;assert.deepEqual(mergeAIDraft(previous,omitted).setup,previous.setup);
 assert.deepEqual(mergeAIDraft(previous,{...omitted,setupPatch:{disclaimer:null}}).setup,previous.setup);
});
test('AI changes invalidate old pin, retain local venue photo and reset only changed disclaimer review',()=>{
 const previous=sample(),answer={...toAIListing(previous),setupPatch:{businessAddress:'New entrance',disclaimer:'Changed terms',referralPercentage:'2'}};
 const next=parseListing(mergeAIDraft(previous,answer));assert.equal(next.setup.business.lat,'');assert.equal(next.setup.business.lng,'');assert.equal(next.location,'New entrance');assert.deepEqual(next.setup.business.photo,photo);assert.equal(next.setup.disclaimerReviewed,false);assert.equal(next.setup.referrals.percentage,'2');
 assert.equal(mergeAIDraft(previous,{...answer,setupPatch:{restrictions:'Bring water'}}).setup.disclaimerReviewed,true);
});
test('client response merge retains local pins and photos with unchanged address',()=>{
 const previous=sample(),received=toAIListing(previous);assert.deepEqual(mergeAIDraft(previous,received).setup,previous.setup);
 received.setup.business.address='Elsewhere';const next=mergeAIDraft(previous,received);assert.equal(next.setup.business.lat,'');assert.deepEqual(next.setup.business.photo,photo);
});
test('map links identify the same exact coordinates and reject incomplete or invalid pins',()=>{
 const urls=mapLinks(sample().setup.business);assert.match(urls.google,/40.1%2C-74.2/);assert.match(urls.bing,/40.1~-74.2/);assert.equal(mapLinks({lat:'',lng:'0'}),null);assert.equal(mapLinks({lat:'100',lng:'0'}),null);assert.ok(mapLinks({lat:'0',lng:'0'}));
});
test('referral split conserves ticket cents and cannot overdraw business share',()=>{
 assert.deepEqual(referralSplit('55','10'),{platform:5.5,referral:5.5,business:44});
 for(let cents=0;cents<100;cents++)for(const percent of ['0','2','10','89.99','90']){const split=referralSplit((cents/100).toFixed(2),percent);assert.ok(split.business>=0);assert.equal(Math.round((split.platform+split.referral+split.business)*100),cents);}
 assert.equal(referralSplit('55','91'),null);
});
test('extended draft cannot enter publication path that lacks setup support',()=>{
 assert.ok(publicationErrors(sample()).some(x=>x.includes('extended setup')));assert.ok(!publicationErrors(emptyListing()).some(x=>x.includes('extended setup')));
});
test('Claude patch has no media, coordinate or organiser review fields',()=>{
 const props=answerSchema.properties.patch.properties;
 const fields=props.text.items.properties.field.enum;
 for(const key of ['photo','lat','lng','disclaimerReviewed'])assert.ok(!fields.includes(key));
 assert.ok(fields.includes('disclaimer'));assert.equal(props.text.items.properties.value.type,'string');
});
test('refund wording defaults for old setup, remains separate and accepts only bounded explicit changes',()=>{
 const previous=sample();delete previous.setup.refundPolicy;assert.equal(parseSetup(previous.setup).refundPolicy,'');
 const changed=mergeAIDraft(previous,{...emptyListing(),setupPatch:{refundPolicy:'Change-of-mind sales are final.'}});
 assert.equal(changed.setup.refundPolicy,'Change-of-mind sales are final.');assert.equal(changed.setup.disclaimer,previous.setup.disclaimer);
 assert.throws(()=>parseSetup({...changed.setup,refundPolicy:'x'.repeat(4001)}));
 assert.equal(mergeAIDraft(changed,{...emptyListing(),setupPatch:{refundPolicy:null}}).setup.refundPolicy,changed.setup.refundPolicy);
});
test('actual chat handler strips photo data, preserves setup and applies explicit patch',async()=>{
 const moduleURL=name=>JSON.stringify(new URL(`../lib/${name}`,import.meta.url).href);
 let captured;
 globalThis.__setupClaude=async({system})=>{captured=system;return {reply:'What date?',patch:{restrictions:'Closed shoes required',referralPercentage:'2'},sources:[{field:'restrictions',sourceText:'Require closed shoes'},{field:'referralPercentage',sourceText:'offer 2% referral.'}],pending:[]};};
 let source=await readFile(new URL('../app/api/chat/route.js',import.meta.url),'utf8');
 source=source.replace("import {connections,sameOrigin} from '../../../lib/services';",'const connections=()=>({ai:true});const sameOrigin=()=>true;')
  .replace("'../../../lib/listing.mjs'",moduleURL('listing.mjs')).replace("'../../../lib/setup.mjs'",moduleURL('setup.mjs'))
  .replace("'../../../lib/speech-server.mjs'",moduleURL('speech-server.mjs'))
  .replace("'../../../lib/conversation-patches.mjs'",moduleURL('conversation-patches.mjs'))
  .replace("'../../../lib/conversation-state.mjs'",moduleURL('conversation-state.mjs'))
  .replace("import {claudeCompletion,ClaudeError} from '../../../lib/claude-ai.mjs';",'const claudeCompletion=globalThis.__setupClaude;class ClaudeError extends Error {}');
 const {POST}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
 const response=await POST(new Request('https://example.invalid/api/chat',{method:'POST',body:JSON.stringify({messages:[{role:'user',content:'Require closed shoes, offer 2% referral.'}],draft:sample()})}));
 assert.equal(response.status,200);const result=await response.json();assert.equal(result.draft.setup.restrictions,'Closed shoes required');assert.equal(result.draft.setup.referrals.percentage,'2');assert.equal(result.draft.setup.disclaimerReviewed,true);assert.ok(!captured.includes(photo.dataUrl));assert.equal(result.draft.setup.business.photo,null);
 delete globalThis.__setupClaude;
});

