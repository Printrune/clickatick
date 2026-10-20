import {DemoError,demoId,exactKeys} from './demo-http.mjs';
import {createHash} from 'node:crypto';
import {createDemoBlobStore} from './demo-blob-store.mjs';
import {marketingService} from './marketing-service.mjs';

const PREFIX='clickatick-demo/v1/artwork';
const IMAGE_BYTES=460000;
const PROMPT_MAX=1200;
const GLOBAL_ATTEMPTS=20;

export function parseGeneratedCover(value){
  if(!exactKeys(value,['mime','dataUrl','origin'])||value.mime!=='image/jpeg'||value.origin!=='generated'||typeof value.dataUrl!=='string'||value.dataUrl.length>450000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.dataUrl))throw new DemoError('The generated image could not be saved.',503);
  const encoded=value.dataUrl.slice('data:image/jpeg;base64,'.length),bytes=Buffer.from(encoded,'base64');
  if(!bytes.length||bytes.length>340000||bytes.toString('base64')!==encoded||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9)throw new DemoError('The generated image could not be saved.',503);
  return {mime:'image/jpeg',dataUrl:value.dataUrl,origin:'generated'};
}

export function artworkReady(env=process.env){return env.EVENT_ARTWORK_GATEWAY_ENABLED==='true'&&env.EVENT_ARTWORK_CREDIT_CONFIRMED==='true'&&Boolean((env.AI_GATEWAY_API_KEY||env.VERCEL_OIDC_TOKEN)?.trim());}

function gatewayKey(env){return (env.AI_GATEWAY_API_KEY||env.VERCEL_OIDC_TOKEN||'').trim();}
export async function positiveGatewayCredit(env=process.env,fetcher=fetch){
  const key=gatewayKey(env);if(!key)return false;
  try{const response=await fetcher('https://ai-gateway.vercel.sh/v1/credits',{headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(8000)});if(!response.ok)return false;const body=await response.json();return Number.isFinite(Number(body?.balance))&&Number(body.balance)>0;}
  catch{return false;}
}

function artworkPrompt(listing){
  const draft=listing.draft,where=draft.setup?.event?.address||draft.setup?.business?.address||draft.location;
  const facts=[draft.title,draft.type,where,draft.schedule?.dates?.slice(0,3).join(', ')||'',draft.description].filter(Boolean).join(' · ').slice(0,900);
  return `Create one realistic editorial image for this event or activity listing. Use the reference illustration for composition and atmosphere where possible, while making the scene photorealistic. Do not add text, logos, pricing, QR codes or claims that the event is verified. Event facts: ${facts}`.slice(0,PROMPT_MAX);
}

export async function generateGatewayArtwork(listing,env=process.env){
  const {generateImage}=await import('ai');
  const sharp=(await import('sharp')).default;
  const scene=listing.draft.coverImage;
  const prompt=scene?{text:artworkPrompt(listing),images:[Buffer.from(scene.dataUrl.slice('data:image/jpeg;base64,'.length),'base64')]}:artworkPrompt(listing);
  const result=await generateImage({model:'bfl/flux-3-image-klein',prompt,aspectRatio:'4:3',abortSignal:AbortSignal.timeout(45000)});
  const raw=result.image?.uint8Array||result.images?.[0]?.uint8Array;
  if(!raw||raw.byteLength>12*1024*1024)throw new DemoError('The image service did not return a usable image.',503);
  let bytes=await sharp(raw).rotate().resize({width:800,height:600,fit:'inside',withoutEnlargement:true}).jpeg({quality:72,mozjpeg:true}).toBuffer();
  if(bytes.length>340000)bytes=await sharp(raw).rotate().resize({width:640,height:480,fit:'inside',withoutEnlargement:true}).jpeg({quality:55,mozjpeg:true}).toBuffer();
  return parseGeneratedCover({mime:'image/jpeg',dataUrl:`data:image/jpeg;base64,${bytes.toString('base64')}`,origin:'generated'});
}

export function createArtworkService({store=createDemoBlobStore(),authorize=(id,token)=>marketingService.authorize(id,token),environment=()=>process.env,checkCredit=positiveGatewayCredit,generate=generateGatewayArtwork}={}){
  async function reserveGlobal(listingId,requestId){
    const start=parseInt(createHash('sha256').update(listingId).digest('hex').slice(0,8),16)%GLOBAL_ATTEMPTS;
    for(let offset=0;offset<GLOBAL_ATTEMPTS;offset++){
      const slot=(start+offset)%GLOBAL_ATTEMPTS,path=`${PREFIX}/global/${String(slot).padStart(2,'0')}.json`;
      const existing=await store.read(path,1024);
      const result=existing?{record:existing}:await store.create(path,{version:1,listingId,requestId},1024);
      const record=result.record;
      if(!exactKeys(record,['version','listingId','requestId'])||record.version!==1||typeof record.listingId!=='string'||typeof record.requestId!=='string')throw new DemoError('Image generation storage is unavailable.',503);
      if(record.listingId===listingId){if(record.requestId!==requestId)throw new DemoError('This event already used its image generation attempt.',409);return;}
    }
    throw new DemoError('This demo has reached its image generation limit. The event illustration remains visible.',429);
  }
  async function read(id){const key=demoId(id);let record;try{record=await store.read(`${PREFIX}/${key}/result.json`,IMAGE_BYTES);}catch{return null;}if(!record)return null;try{if(!exactKeys(record,['version','coverImage'])||record.version!==1)throw new Error();return parseGeneratedCover(record.coverImage);}catch{return null;}}
  async function create(id,token,input){
    const key=demoId(id);
    // Validate the capability before reading any creator data or checking external services.
    const listing=await authorize(key,token);
    if(!exactKeys(input,['id']))throw new DemoError('Use one image request identifier.');
    const requestId=demoId(input.id),saved=await read(key);
    if(saved)return {coverImage:saved,created:false};
    if(!artworkReady(environment()))throw new DemoError('Realistic image generation is unavailable. The event illustration remains visible.',503);
    if(!await checkCredit(environment()))throw new DemoError('AI Gateway credit is unavailable. The event illustration remains visible.',503);
    const claimPath=`${PREFIX}/${key}/claim.json`;
    const claim=await store.create(claimPath,{version:1,id:requestId},1024);
    if(!exactKeys(claim.record,['version','id'])||claim.record.version!==1||claim.record.id!==requestId)throw new DemoError('This event already used its image generation attempt.',409);
    if(!claim.created)throw new DemoError('This image request already started. Its result is unavailable. The event illustration remains visible.',409);
    await reserveGlobal(key,requestId);
    let coverImage;
    try{coverImage=parseGeneratedCover(await generate(listing,environment()));}
    catch(error){if(error instanceof DemoError)throw error;throw new DemoError('The image service could not finish. The event illustration remains visible.',503);}
    const result=await store.create(`${PREFIX}/${key}/result.json`,{version:1,coverImage},IMAGE_BYTES);
    return {coverImage:parseGeneratedCover(result.record.coverImage),created:result.created};
  }
  return {read,create};
}
export const artworkService=createArtworkService();
