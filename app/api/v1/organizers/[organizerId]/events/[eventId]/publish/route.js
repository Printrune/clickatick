import {publish} from '../../../../../../../../lib/integrated-phase-a4-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../../../../../lib/integrated-phase-a1.mjs';
export async function POST(request,{params}={}){try{const {organizerId,eventId}=await params;return jsonResponse(await publish(organizerId,eventId,request),201);}catch(error){return errorResponse(error);}}
