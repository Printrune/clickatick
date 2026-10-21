import {phaseA2} from '../../../../../../../lib/integrated-phase-a2-runtime.mjs';
import {jsonResponse} from '../../../../../../../lib/integrated-phase-a1.mjs';
import {phaseA2ErrorResponse as errorResponse} from '../../../../../../../lib/integrated-phase-a2-service.mjs';
export async function GET(_request,{params}){try{const {organizerId,eventId}=await params;return jsonResponse(await phaseA2.get(organizerId,eventId));}catch(error){return errorResponse(error);}}
export async function PATCH(request,{params}){try{const {organizerId,eventId}=await params;return jsonResponse(await phaseA2.patch(organizerId,eventId,request));}catch(error){return errorResponse(error);}}
