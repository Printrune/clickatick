import {a6Create,a6ErrorResponse} from '../../../../../../../../lib/integrated-phase-a6-runtime.mjs';
import {jsonResponse} from '../../../../../../../../lib/integrated-phase-a1.mjs';
export async function POST(request,{params}={}){try{const {organizerId,eventId}=await params;const result=await a6Create(organizerId,eventId,request);return jsonResponse(result.data,result.statusCode);}catch(error){return a6ErrorResponse(error);}}
