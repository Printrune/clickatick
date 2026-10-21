import {createHash,randomUUID} from 'node:crypto';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED=new Set(['admin','api','creator','dashboard','discover','events','listing','receipt','sign-in','sign-up','start']);
const MAX_BODY=8192;
export class PhaseA1Error extends Error{constructor(code,message,status,fields){super(message);this.code=code;this.status=status;this.fields=fields;}}
const failure=(code,message,status,fields)=>{throw new PhaseA1Error(code,message,status,fields);};
const exactKeys=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const permissions=()=>({viewDashboard:true,createEvent:false,editEvent:false,publishEvent:false,manageMembers:false});
const brandSummary=row=>({id:row.id,slug:row.slug,name:row.name,role:row.role,permissions:permissions(),dashboardUrl:`/dashboard/${row.id}`});
const envelope=data=>({data,error:null});
export function errorResponse(error){
 const known=error instanceof PhaseA1Error;
 return Response.json({data:null,error:{code:known?error.code:'SERVICE_UNAVAILABLE',message:known?error.message:'Organizer service is unavailable.',...(known&&error?.fields?{fields:error.fields}:{}),...(known&&error?.currentVersion?{currentVersion:error.currentVersion}:{}),...(known&&error?.publicUrl?{publicUrl:error.publicUrl}:{}),...(known&&error?.receiptUrl?{receiptUrl:error.receiptUrl}:{}),...(known&&error?.currentVersions?{currentVersions:error.currentVersions}:{}),...(known&&error?.dashboardUrl?{dashboardUrl:error.dashboardUrl}:{}),...(known&&error?.detailUrl?{detailUrl:error.detailUrl}:{}),...(known&&Number.isInteger(error?.currentEventVersion)?{currentEventVersion:error.currentEventVersion}:{}),...(known&&Number.isInteger(error?.quoteEventVersion)?{quoteEventVersion:error.quoteEventVersion}:{}),...(known&&Number.isInteger(error?.retryAfter)?{retryAfterSeconds:error.retryAfter}:{})}},{status:known?error.status:503,headers:{'Cache-Control':'no-store',...(known&&error?.status===429&&Number.isInteger(error.retryAfter)?{'Retry-After':String(error.retryAfter)}:{})}});
}
export function jsonResponse(data,status=200){return Response.json(envelope(data),{status,headers:{'Cache-Control':'no-store'}});}
export function originMatches(request){
 try{const origin=request.headers.get('origin'),host=request.headers.get('host');if(!origin||!host)return false;const source=new URL(origin);return ['http:','https:'].includes(source.protocol)&&source.host===host&&source.protocol===new URL(request.url).protocol;}catch{return false;}
}
export async function readBody(request){
 if(!originMatches(request))failure('WRONG_ORIGIN','Please use the clickatick website.',403);
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')failure('INVALID_INPUT','Send JSON details.',400);
 const reader=request.body?.getReader();if(!reader)failure('INVALID_INPUT','Add the brand details.',400);
 const chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();failure('INVALID_INPUT','These brand details are too large.',400);}chunks.push(value);}}finally{reader.releaseLock();}
 try{return JSON.parse(Buffer.concat(chunks.map(chunk=>Buffer.from(chunk)),size).toString('utf8'));}catch{failure('INVALID_INPUT','Check the brand details.',400);}
}
export function parseCreateBrand(value){
 if(!exactKeys(value,['name','slug','idempotencyKey']))failure('INVALID_INPUT','Check the brand details.',400);
 const name=typeof value.name==='string'?value.name.trim():'';
 const slug=typeof value.slug==='string'?value.slug:'';
 const key=value.idempotencyKey;
 const fields=[];
 if(name.length<2||name.length>100)fields.push({path:'name',code:'INVALID_LENGTH',message:'Use 2 to 100 characters.'});
 if(slug.length<3||slug.length>48||!SLUG.test(slug)||RESERVED.has(slug))fields.push({path:'slug',code:'INVALID_SLUG',message:'Use 3 to 48 lowercase letters, numbers or hyphens.'});
 if(typeof key!=='string'||!UUID.test(key))fields.push({path:'idempotencyKey',code:'INVALID_ID',message:'Try the request again.'});
 if(fields.length)failure('INVALID_INPUT','Check the brand details.',400,fields);
 return {name,slug,key:key.toLowerCase()};
}
export function createPhaseA1Service({subject,store,environment=()=>process.env}={}){
 async function identity(){
  const env=environment();if(!env.CLERK_SECRET_KEY?.trim()||!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim())failure('AUTH_UNAVAILABLE','Organizer sign-in is not connected yet.',503);
  let userId;try{userId=await subject();}catch{failure('AUTH_UNAVAILABLE','Organizer sign-in is unavailable.',503);}
  if(!userId)failure('SIGN_IN_REQUIRED','Sign in to manage a brand.',401);
  if(typeof userId!=='string'||userId.length>255)failure('AUTH_UNAVAILABLE','Organizer sign-in is unavailable.',503);
  return userId;
 }
 async function database(){if(!environment().DATABASE_URL?.trim())failure('DATABASE_UNAVAILABLE','Organizer storage is not connected yet.',503);try{return await store();}catch{failure('DATABASE_UNAVAILABLE','Organizer storage is unavailable.',503);}}
 async function me(){const userId=await identity(),db=await database();let rows;try{rows=await db.listBrands(userId);}catch{failure('DATABASE_UNAVAILABLE','Organizer storage is unavailable.',503);}return {userId,brands:rows.map(brandSummary),nextAction:rows.length?null:'create-organizer'};}
 async function brand(organizerId){
  const userId=await identity();if(typeof organizerId!=='string'||!UUID.test(organizerId))failure('INVALID_INPUT','Check the brand address.',400);
  const db=await database();let row;try{row=await db.getBrand(userId,organizerId.toLowerCase());}catch{failure('DATABASE_UNAVAILABLE','Organizer storage is unavailable.',503);}
  if(!row)failure('BRAND_NOT_FOUND','This brand was not found.',404);
  if(row.member_status==='disabled')failure('MEMBERSHIP_DISABLED','Your access to this brand is disabled.',403);
  if(row.organizer_status!=='active')failure('BRAND_NOT_FOUND','This brand was not found.',404);
  return {brand:{id:row.id,slug:row.slug,name:row.name,version:row.version,role:row.role,status:row.organizer_status},dashboard:{state:'events-not-connected',message:'Event management is being connected.',createEventUrl:'/creator'}};
 }
 async function create(request){
  const userId=await identity(),input=parseCreateBrand(await readBody(request)),db=await database();
  const requestHash=createHash('sha256').update(JSON.stringify({name:input.name,slug:input.slug})).digest('hex');
  let result;try{result=await db.createBrand({userId,...input,requestHash,id:randomUUID()});}
  catch(error){if(error?.code==='23505'&&error?.constraint==='organizers_slug_key')failure('SLUG_TAKEN','This brand address is already used.',409,[{path:'slug',code:'SLUG_TAKEN',message:'Choose another brand address.'}]);failure('DATABASE_UNAVAILABLE','Organizer storage is unavailable.',503);}
  if(result.kind==='idempotency-conflict')failure('IDEMPOTENCY_CONFLICT','This request identifier was used for different details.',409);
  if(result.kind==='slug-taken')failure('SLUG_TAKEN','This brand address is already used.',409,[{path:'slug',code:'SLUG_TAKEN',message:'Choose another brand address.'}]);
  if(result.kind==='rate-limited')failure('TOO_MANY_REQUESTS','Try again in a minute.',429);
  if(!['created','replayed'].includes(result.kind)||!result.brand?.id)failure('DATABASE_UNAVAILABLE','Organizer storage is unavailable.',503);
  return {brand:{id:result.brand.id,slug:result.brand.slug,name:result.brand.name,role:'owner'},dashboardUrl:`/dashboard/${result.brand.id}`};
 }
 return {me,brand,create};
}



