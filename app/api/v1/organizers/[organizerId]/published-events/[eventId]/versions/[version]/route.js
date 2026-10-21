import {a6Version,a6ErrorResponse} from '../../../../../../../../../lib/integrated-phase-a6-runtime.mjs';
import {jsonResponse} from '../../../../../../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}={}){try{const {organizerId,eventId,version}=await params;return jsonResponse(await a6Version(organizerId,eventId,version));}catch(error){return a6ErrorResponse(error);}}
