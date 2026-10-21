import {a6Save,a6ErrorResponse} from '../../../../../../../../../lib/integrated-phase-a6-runtime.mjs';
import {jsonResponse} from '../../../../../../../../../lib/integrated-phase-a1.mjs';
export async function PATCH(request,{params}={}){try{const {organizerId,eventId,revisionId}=await params;return jsonResponse(await a6Save(organizerId,eventId,revisionId,request));}catch(error){return a6ErrorResponse(error);}}
