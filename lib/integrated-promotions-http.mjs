import {jsonResponse,errorResponse} from './integrated-phase-a1.mjs';
import {listCodes,createCode,mutateCode} from './integrated-promotions.mjs';

export async function codeList(request,params,kind){try{const p=await params;return jsonResponse(await listCodes(p.organizerId,kind,p.eventId??null,new URL(request.url).searchParams));}catch(error){return errorResponse(error);}}
export async function codeCreate(request,params,kind){try{const p=await params;const result=await createCode(p.organizerId,kind,p.eventId??null,request);const {replayed,...data}=result;return jsonResponse(data,replayed?200:201);}catch(error){return errorResponse(error);}}
export async function codeMutate(request,params,kind,operation){try{const p=await params;return jsonResponse(await mutateCode(p.organizerId,kind,p.eventId??null,p.id,operation,request));}catch(error){return errorResponse(error);}}
