import {createHash} from 'node:crypto';
import {creatorHash,creatorExpires} from './marketing-http.mjs';
import {parseListing,scheduleLabel} from './listing.mjs';
import {demoPublicationErrors,demoOccurrences,demoTicketTypes,MAX_DEMO_TICKETS,MAX_DEMO_ITEMS} from './demo-validation.mjs';
import {createDemoBlobStore,demoStorageConfigured} from './demo-blob-store.mjs';
import {DemoError,demoId,exactKeys,UUID,LISTING_BYTES,RECEIPT_BYTES} from './demo-http.mjs';
import {createArtworkService} from './event-artwork.mjs';
export {demoStorageConfigured} from './demo-blob-store.mjs';
export function demoPublishingReady(env=process.env){return env.DEMO_PUBLISHING_ENABLED==='true'&&demoStorageConfigured(env);}
const PREFIX='clickatick-demo/v1';
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const iso=value=>typeof value==='string'&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString()===value;
function unavailable(){return new DemoError('Demo storage is unavailable. Your draft and selections are kept.',503);}
function conflict(){return new DemoError('This demo identifier already belongs to different content. Use a new version.',409);}
function listingRecord(record,id){
 try{if(!(exactKeys(record,['version','id','digest','createdAt','draft','demo'])&&record.version===1||exactKeys(record,['version','id','digest','createdAt','draft','demo','creatorHash'])&&record.version===2&&/^[a-f0-9]{64}$/.test(record.creatorHash))||record.demo!==true||record.id!==id||!iso(record.createdAt))throw new Error();const draft=parseListing(record.draft);if(demoPublicationErrors(draft).length||record.digest!==digest(draft))throw new Error();return {...record,draft};}catch{throw unavailable();}
}
function publicListing(record,coverImage){return {id:record.id,draft:record.draft,createdAt:record.createdAt,demo:true,coverImage};}
function receiptRecord(record,id){
 try{
  if(!exactKeys(record,['version','digest','receipt'])||record.version!==1||typeof record.digest!=='string'||!/^[a-f0-9]{64}$/.test(record.digest))throw new Error();
  const receipt=record.receipt;
  if(!exactKeys(receipt,['id','listingId','title','timezone','occurrence','createdAt','demo','status','currency','items','totalCents','chargedCents'])||receipt.id!==id||demoId(receipt.listingId)!==receipt.listingId||!iso(receipt.createdAt)||receipt.demo!==true||receipt.status!=='demo'||receipt.currency!=='USD'||receipt.chargedCents!==0||typeof receipt.title!=='string'||!receipt.title||receipt.title.length>200||typeof receipt.timezone!=='string'||receipt.timezone.length>200||typeof receipt.occurrence!=='string'||!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(receipt.occurrence)||!Array.isArray(receipt.items)||!receipt.items.length||receipt.items.length>MAX_DEMO_ITEMS)throw new Error();
  const seen=new Set();let total=0,count=0;
  for(const item of receipt.items){if(!exactKeys(item,['tierId','name','quantity','unitPriceCents','lineTotalCents'])||typeof item.tierId!=='string'||(item.tierId!=='general'&&demoId(item.tierId)!==item.tierId)||seen.has(item.tierId)||typeof item.name!=='string'||!item.name||item.name.length>100||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>MAX_DEMO_TICKETS||!Number.isInteger(item.unitPriceCents)||item.unitPriceCents<0||item.unitPriceCents>10000000||item.lineTotalCents!==item.unitPriceCents*item.quantity)throw new Error();seen.add(item.tierId);total+=item.lineTotalCents;count+=item.quantity;}
  if(count>MAX_DEMO_TICKETS||total!==receipt.totalCents||record.digest!==digest({listingId:receipt.listingId,occurrence:receipt.occurrence,items:receipt.items}))throw new Error();new Intl.DateTimeFormat('en-US',{timeZone:receipt.timezone});return record;
 }catch{throw unavailable();}
}
export function createDemoService({store=createDemoBlobStore(),environment=()=>process.env,now=()=>new Date(),artwork=createArtworkService({store})}={}){
 async function activeCover(record){return await artwork.read(record.id)||record.draft.coverImage||null;}
 async function reserve(kind,id,contentDigest){
  const cap=kind==='listings'?20:100;
  const start=parseInt(createHash('sha256').update(id).digest('hex').slice(0,8),16)%cap;
  for(let offset=0;offset<cap;offset++){
   const slot=(start+offset)%cap,path=`${PREFIX}/quota/${kind}/${String(slot).padStart(3,'0')}.json`;
   let record=await store.read(path,1024);
   if(!record){const claim={version:1,kind,id,digest:contentDigest};record=(await store.create(path,claim,1024)).record;}
   if(!exactKeys(record,['version','kind','id','digest'])||record.version!==1||record.kind!==kind||typeof record.id!=='string'||!UUID.test(record.id)||typeof record.digest!=='string'||!/^[a-f0-9]{64}$/.test(record.digest))throw unavailable();
   if(record.id===id){if(record.digest!==contentDigest)throw conflict();return;}
  }
  throw new DemoError(`This public demo has reached its ${kind==='listings'?'20-listing':'100-confirmation'} limit. Existing public demos remain available.`,429);
 }
 async function getListing(id){
  const key=demoId(id);if(!demoStorageConfigured(environment()))return null;
  const record=await store.read(`${PREFIX}/listings/${key}.json`,LISTING_BYTES);return record?listingRecord(record,key):null;
 }
 async function readDemoListing(id){const record=await getListing(id);return record?publicListing(record,await activeCover(record)):null;}
 async function readDemoCatalog(){
  if(!demoStorageConfigured(environment()))throw unavailable();
  const listings=[];
  for(let slot=0;slot<20;slot++){
   const claim=await store.read(`${PREFIX}/quota/listings/${String(slot).padStart(3,'0')}.json`,1024);
   if(!claim)continue;
   if(!exactKeys(claim,['version','kind','id','digest'])||claim.version!==1||claim.kind!=='listings'||typeof claim.id!=='string'||!UUID.test(claim.id)||claim.id!==claim.id.toLowerCase()||typeof claim.digest!=='string'||!/^[a-f0-9]{64}$/.test(claim.digest))throw unavailable();
   const record=await getListing(claim.id);
   if(!record)continue;
   if(record.digest!==claim.digest)throw unavailable();
   const draft=record.draft;
   listings.push({id:record.id,title:draft.title,type:draft.type,description:draft.description,location:draft.location,scheduleLabel:scheduleLabel(draft),price:draft.price,capacity:draft.capacity,createdAt:record.createdAt,demo:true});
  }
  return listings.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
 }
 async function readDemoReceipt(id){
  const key=demoId(id);if(!demoStorageConfigured(environment()))return null;
  const record=await store.read(`${PREFIX}/receipts/${key}.json`,RECEIPT_BYTES);if(!record)return null;
  const receipt=receiptRecord(record,key).receipt,listing=await getListing(receipt.listingId);
  return {...receipt,coverImage:listing?await activeCover(listing):null};
 }
 async function publish(input){
  if(!demoPublishingReady(environment()))throw new DemoError('Public demo publishing is not connected yet. Your draft is kept.',503);
  if(!exactKeys(input,['id','draft'])&&!exactKeys(input,['id','draft','creatorToken']))throw new DemoError('Use only the reviewed listing and its demo identifier.');
  const id=demoId(input.id),ownerHash=Object.hasOwn(input,'creatorToken')?creatorHash(input.creatorToken):null;let draft;try{draft=parseListing(input.draft);}catch(error){throw new DemoError(error.message);}
  const errors=demoPublicationErrors(draft);if(errors.length)throw new DemoError(errors.join(' '));
  const contentDigest=digest(draft),path=`${PREFIX}/listings/${id}.json`;
  const previous=await store.read(path,LISTING_BYTES);
  if(previous){const record=listingRecord(previous,id);if(record.digest!==contentDigest||(ownerHash&&record.creatorHash!==ownerHash))throw conflict();return {created:false,id,url:`/listing/${id}`,demo:true,...(ownerHash?{creatorExpiresAt:creatorExpires(record.createdAt)}:{})};}
  await reserve('listings',id,contentDigest);
  const proposed={version:ownerHash?2:1,id,digest:contentDigest,createdAt:now().toISOString(),draft,demo:true,...(ownerHash?{creatorHash:ownerHash}:{})};
  const result=await store.create(path,proposed,LISTING_BYTES),stored=listingRecord(result.record,id);
  if(stored.digest!==contentDigest||(ownerHash&&stored.creatorHash!==ownerHash))throw conflict();
  return {created:result.created,id,url:`/listing/${id}`,demo:true,...(ownerHash?{creatorExpiresAt:creatorExpires(stored.createdAt)}:{})};
 }
 async function checkout(listingId,input){
  if(!demoPublishingReady(environment()))throw new DemoError('Demo checkout is not connected yet. No payment was taken.',503);
  if(!exactKeys(input,['id','occurrence','items','acknowledged'])||input.acknowledged!==true||typeof input.occurrence!=='string'||!Array.isArray(input.items)||!input.items.length||input.items.length>MAX_DEMO_ITEMS)throw new DemoError('Choose demo tickets and acknowledge that this is a simulation.');
  const id=demoId(input.id),listing=await getListing(listingId);if(!listing)throw new DemoError('This public demo listing was not found.',404);
  if(!demoOccurrences(listing.draft).includes(input.occurrence))throw new DemoError('Choose an available date and start time from this listing.');
  const types=demoTicketTypes(listing.draft),seen=new Set(),items=[];let count=0;
  for(const selected of input.items){
   if(!exactKeys(selected,['tierId','quantity'])||typeof selected.tierId!=='string'||seen.has(selected.tierId)||!Number.isInteger(selected.quantity)||selected.quantity<1||selected.quantity>MAX_DEMO_TICKETS)throw new DemoError('Choose valid ticket categories and quantities.');
   const type=types.find(tier=>tier.id===selected.tierId);if(!type||type.capacity===null||selected.quantity>type.capacity)throw new DemoError('The demo quantity exceeds the listing ticket limit.');
   seen.add(selected.tierId);count+=selected.quantity;items.push({tierId:type.id,name:type.name,quantity:selected.quantity,unitPriceCents:type.priceCents,lineTotalCents:type.priceCents*selected.quantity});
  }
  if(count>MAX_DEMO_TICKETS||count>Number(listing.draft.capacity))throw new DemoError('The total demo quantity exceeds the listing ticket limit.');
  items.sort((a,b)=>a.tierId.localeCompare(b.tierId));
  const intent={listingId:listing.id,occurrence:input.occurrence,items},contentDigest=digest(intent),path=`${PREFIX}/receipts/${id}.json`;
  const previous=await store.read(path,RECEIPT_BYTES);
  if(previous){const stored=receiptRecord(previous,id);if(stored.digest!==contentDigest)throw conflict();return {created:false,receipt:stored.receipt,url:`/receipt/${id}`,coverImage:await activeCover(listing)};}
  await reserve('receipts',id,contentDigest);
  const receipt={id,listingId:listing.id,title:listing.draft.title,timezone:listing.draft.timezone,occurrence:input.occurrence,createdAt:now().toISOString(),demo:true,status:'demo',currency:'USD',items,totalCents:items.reduce((sum,item)=>sum+item.lineTotalCents,0),chargedCents:0};
  const result=await store.create(path,{version:1,digest:contentDigest,receipt},RECEIPT_BYTES),stored=receiptRecord(result.record,id);
  if(stored.digest!==contentDigest)throw conflict();return {created:result.created,receipt:stored.receipt,url:`/receipt/${id}`,coverImage:await activeCover(listing)};
 }
 return {publish,checkout,readDemoListing,readDemoCatalog,readDemoReceipt};
}
const service=createDemoService();
export const readDemoListing=id=>service.readDemoListing(id);
export const readDemoCatalog=()=>service.readDemoCatalog();
export const readDemoReceipt=id=>service.readDemoReceipt(id);
export const publishDemoListing=input=>service.publish(input);
export const checkoutDemoListing=(id,input)=>service.checkout(id,input);
