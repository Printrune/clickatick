import {PhaseA1Error} from './integrated-phase-a1.mjs';
import {readA2Body,validId} from './integrated-phase-a2.mjs';
import {clerkSubject} from './integrated-phase-a1-runtime.mjs';
import {transactionalDatabase} from './integrated-phase-a4-runtime.mjs';
import {readRevision,createRevision,saveRevision,transitionRevision,readApprovedVersion,readPrivateSeatMap} from './integrated-phase-a6.mjs';

const fail=(code,message,status)=>{throw new PhaseA1Error(code,message,status);};
const keys=(value,names)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===names.slice().sort().join(',');
const positive=value=>Number.isInteger(value)&&value>0;
export async function a6Context(requireRevisions=true){
 if(requireRevisions&&process.env.PUBLISHED_REVISIONS_ENABLED!=='true')fail('REVISIONS_UNAVAILABLE','Published event editing is not connected yet.',503);
 if(!process.env.CLERK_SECRET_KEY?.trim()||!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim())fail('AUTH_UNAVAILABLE','Organizer sign-in is not connected yet.',503);
 if(!process.env.DATABASE_URL?.trim())fail('DATABASE_UNAVAILABLE','Event storage is not connected yet.',503);
 let userId;try{userId=await clerkSubject();}catch{fail('AUTH_UNAVAILABLE','Organizer sign-in is unavailable.',503);}
 if(!userId)fail('AUTH_REQUIRED','Sign in to edit this event.',401);
 return {db:await transactionalDatabase(),userId};
}
export async function a6Read(organizerId,eventId){const {db,userId}=await a6Context();return readRevision({db,organizerId,eventId,userId});}
export async function a6Create(organizerId,eventId,request){const {db,userId}=await a6Context(),body=await readA2Body(request,8192);if(!keys(body,['basePublicVersion','idempotencyKey'])||!positive(body.basePublicVersion))fail('INVALID_BODY','Check the revision request.',400);validId(body.idempotencyKey,'idempotencyKey');return createRevision({db,organizerId,eventId,userId,...body});}
export async function a6Save(organizerId,eventId,revisionId,request){const {db,userId}=await a6Context(),body=await readA2Body(request,256*1024);if(!keys(body,['expectedRevisionVersion','changes'])||!positive(body.expectedRevisionVersion))fail('INVALID_BODY','Check the event changes.',400);return saveRevision({db,organizerId,eventId,revisionId,userId,...body});}
export async function a6Transition(organizerId,eventId,revisionId,action,request){const {db,userId}=await a6Context(),body=await readA2Body(request,8192),expected=action==='approve'?['expectedRevisionVersion','expectedPublicVersion','idempotencyKey']:action==='return'?['expectedRevisionVersion','idempotencyKey','note']:['expectedRevisionVersion','idempotencyKey'];if(!keys(body,expected)||!positive(body.expectedRevisionVersion)||action==='approve'&&!positive(body.expectedPublicVersion))fail('INVALID_BODY','Check the review request.',400);validId(body.idempotencyKey,'idempotencyKey');return transitionRevision({db,organizerId,eventId,revisionId,userId,action,...body});}
export async function a6Version(organizerId,eventId,version){const {db,userId}=await a6Context();return readApprovedVersion({db,organizerId,eventId,userId,version:Number(version)});}
export async function a6SeatMap(organizerId,{eventId=null,revisionId=null,draftId=null},request){if(process.env.SEAT_AUTHORING_ENABLED!=='true')fail('SEAT_AUTHORING_UNAVAILABLE','Seat-map editing is not connected yet.',503);const {db,userId}=await a6Context(!draftId);return readPrivateSeatMap({db,organizerId,eventId,revisionId,draftId,userId,searchParams:new URL(request.url).searchParams});}
export function a6ErrorResponse(error){const known=error instanceof PhaseA1Error;return Response.json({data:null,error:{code:known?error.code:'DATABASE_UNAVAILABLE',message:known?error.message:'Event editing is unavailable.',...(known&&error.fields?{fields:error.fields}:{}),...(known&&error.currentVersions?{currentVersions:error.currentVersions}:{}),...(known&&error.refetchUrl?{refetchUrl:error.refetchUrl}:{}),...(known&&error.editUrl?{editUrl:error.editUrl}:{}),...(known&&error.revisionId?{revisionId:error.revisionId}:{})}},{status:known?error.status:503,headers:{'Cache-Control':'no-store'}});}
