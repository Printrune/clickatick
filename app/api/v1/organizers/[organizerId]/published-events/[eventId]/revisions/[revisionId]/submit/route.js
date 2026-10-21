import {a6Transition,a6ErrorResponse} from '../../../../../../../../../../lib/integrated-phase-a6-runtime.mjs';
import {jsonResponse} from '../../../../../../../../../../lib/integrated-phase-a1.mjs';
export async function POST(request,{params}={}){try{const {organizerId,eventId,revisionId}=await params;const result=await a6Transition(organizerId,eventId,revisionId,'submit',request);return jsonResponse(result.data,result.statusCode);}catch(error){return a6ErrorResponse(error);}}
