import {phaseA2} from '../../../../../../lib/integrated-phase-a2-runtime.mjs';
import {jsonResponse} from '../../../../../../lib/integrated-phase-a1.mjs';
import {phaseA2ErrorResponse as errorResponse} from '../../../../../../lib/integrated-phase-a2-service.mjs';
export async function GET(request,{params}){try{const {organizerId}=await params;return jsonResponse(await phaseA2.list(organizerId,new URL(request.url).searchParams));}catch(error){return errorResponse(error);}}
export async function POST(request,{params}){try{const {organizerId}=await params;return jsonResponse(await phaseA2.create(organizerId,request),201);}catch(error){return errorResponse(error);}}
