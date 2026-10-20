import {createHash} from 'node:crypto';
import {createDemoBlobStore,demoStorageConfigured} from './demo-blob-store.mjs';
import {DemoError,demoId,exactKeys,LISTING_BYTES} from './demo-http.mjs';
import {creatorMatches,creatorExpires} from './marketing-http.mjs';
import {parseListing} from './listing.mjs';
import {claudeReady} from './claude-ai.mjs';
import {refineMarketingWithClaude} from './marketing-claude.mjs';
export const MARKETING_BYTES=24*1024;
const PREFIX='clickatick-marketing/v1',CAP=20;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const denied=()=>new DemoError('Private creator access is unavailable in this browser. Open the browser used to publish this event.',403);
const unavailable=()=>new DemoError('Marketing storage is unavailable. Your edits are kept.',503);
export function parseMarketingDraft(value){
 if(!exactKeys(value,['kind','title','caption','altText','placement'])||!['social','poster','video','ad-plan'].includes(value.kind))throw new DemoError('Check the marketing draft.');
 const output={kind:value.kind};
 for(const [key,limit]of [['title',200],['caption',6000],['altText',1000],['placement',100]]){if(typeof value[key]!=='string'||value[key].length>limit||(['title','caption'].includes(key)&&!value[key].trim()))throw new DemoError('Check the marketing draft text.');output[key]=value[key].trim();}return output;
}
export function createMarketingService({store=createDemoBlobStore(),environment=()=>process.env,now=()=>new Date(),refiner=refineMarketingWithClaude}={}){
 async function authorize(id,token){
  const key=demoId(id);if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||!demoStorageConfigured(environment()))throw denied();
  const record=await store.read(`clickatick-demo/v1/listings/${key}.json`,LISTING_BYTES);
  if(!record||record.version!==2||record.id!==key||record.demo!==true||!creatorMatches(token,record.creatorHash)||!Number.isFinite(Date.parse(record.createdAt))||now().getTime()>=Date.parse(creatorExpires(record.createdAt)))throw denied();
  const draft=parseListing(record.draft);if(record.digest!==digest(draft))throw unavailable();
  if(await store.read(`${PREFIX}/${key}/revoked.json`,1024))throw denied();
  return {id:key,draft,createdAt:record.createdAt,demo:true,listingFingerprint:record.digest,accessExpiresAt:creatorExpires(record.createdAt)};
 }
 async function slots(prefix,cap,limit=MARKETING_BYTES){return Promise.all(Array.from({length:cap},(_,slot)=>store.read(`${prefix}/${slot}.json`,limit)));}
 async function reserve(prefix,cap,record,limit=MARKETING_BYTES){
  for(let slot=0;slot<cap;slot++){
   const path=`${prefix}/${slot}.json`,existing=await store.read(path,limit),result=existing?{record:existing,created:false}:await store.create(path,record,limit);
   if(result.record.id===record.id){if(result.record.digest!==record.digest)throw new DemoError('This request belongs to different marketing content.',409);return result;}
  }throw new DemoError('This demonstration has reached its marketing limit. Saved versions remain available.',429);
 }
 function publicVersion(record,approval){return {...record.version,status:approval?'approved':'needs-review',approvedAt:approval?.approvedAt||null};}
 async function versionsFor(listing){
  const records=(await slots(`${PREFIX}/${listing.id}/versions`,CAP)).filter(Boolean);
  const versions=await Promise.all(records.map(async record=>{
   if(record.version?.listingId!==listing.id||record.version?.listingFingerprint!==listing.listingFingerprint||record.digest!==digest(parseMarketingDraft(record.version.draft)))throw unavailable();
   const approval=await store.read(`${PREFIX}/${listing.id}/approvals/${demoId(record.id)}.json`,1024);return publicVersion(record,approval);
  }));return versions.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
 }
 async function read(id,token){const listing=await authorize(id,token),versions=await versionsFor(listing),used=(await slots(`${PREFIX}/${listing.id}/refinements`,3,2048)).filter(Boolean).length;const {listingFingerprint,accessExpiresAt,...publicListing}=listing;return {listing:publicListing,versions,accessExpiresAt,refinement:{available:claudeReady(environment())&&used<3,remaining:Math.max(0,3-used)}};}
 async function save(id,token,input){
  const listing=await authorize(id,token);if(!exactKeys(input,['id','draft']))throw new DemoError('Check the marketing version.');
  const versionId=demoId(input.id),draft=parseMarketingDraft(input.draft),version={id:versionId,listingId:listing.id,listingFingerprint:listing.listingFingerprint,createdAt:now().toISOString(),draft,destination:`/listing/${listing.id}`,demo:true};
  const result=await reserve(`${PREFIX}/${listing.id}/versions`,CAP,{id:versionId,digest:digest(draft),version});const approval=await store.read(`${PREFIX}/${listing.id}/approvals/${versionId}.json`,1024);return {version:publicVersion(result.record,approval),created:result.created};
 }
 async function approve(id,token,input){const listing=await authorize(id,token);if(!exactKeys(input,['versionId']))throw new DemoError('Choose a saved marketing version.');const versionId=demoId(input.versionId),version=(await versionsFor(listing)).find(item=>item.id===versionId);if(!version)throw new DemoError('Save this version before approving it.',404);const result=await store.create(`${PREFIX}/${listing.id}/approvals/${versionId}.json`,{approvedAt:now().toISOString()},1024);return {version:{...version,status:'approved',approvedAt:result.record.approvedAt}};}
 async function revoke(id,token){const listing=await authorize(id,token);await store.create(`${PREFIX}/${listing.id}/revoked.json`,{revokedAt:now().toISOString()},1024);return {revoked:true};}
 async function refine(id,token,input){
  const listing=await authorize(id,token);if(!exactKeys(input,['id','draft','instruction'])||typeof input.instruction!=='string'||!input.instruction.trim()||input.instruction.length>1000)throw new DemoError('Add a short request for the marketing assistant.');
  const requestId=demoId(input.id),draft=parseMarketingDraft(input.draft),instruction=input.instruction.trim(),hash=digest({listingId:listing.id,draft,instruction}),path=`${PREFIX}/${listing.id}/results/${requestId}.json`;
  const cached=await store.read(path,MARKETING_BYTES);if(cached){if(cached.digest!==hash)throw new DemoError('This request belongs to different marketing content.',409);return {...cached.result,created:false};}
  if(!claudeReady(environment()))throw new DemoError('The marketing assistant is not connected within the approved AI allowance. You can edit and save the draft.',503);
  const claim={id:requestId,digest:hash,listingId:listing.id};
  const local=await reserve(`${PREFIX}/${listing.id}/refinements`,3,claim,2048);
  if(!local.created)throw new DemoError('This AI request already started. Its result is unavailable. Your edits are kept. A new attempt uses another request.',409);
  const global=await reserve(`${PREFIX}/refinements`,20,claim,2048);
  if(!global.created)throw new DemoError('This AI request already started. Your edits are kept.',409);
  const candidate=await refiner({listing:{id:listing.id,draft:listing.draft},draft,instruction},environment());
  const result={draft:parseMarketingDraft({...draft,title:candidate.headline,caption:candidate.caption}),reply:candidate.reply,ai:true};
  await store.create(path,{digest:hash,result},MARKETING_BYTES);return {...result,created:true};
 }
 return {authorize,read,save,approve,revoke,refine};
}
export const marketingService=createMarketingService();
