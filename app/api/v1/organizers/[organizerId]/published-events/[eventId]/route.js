import {ownerEvent} from '../../../../../../../lib/integrated-phase-a4-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}={}){try{return jsonResponse(await ownerEvent((await params).organizerId,(await params).eventId));}catch(error){return errorResponse(error);}}
