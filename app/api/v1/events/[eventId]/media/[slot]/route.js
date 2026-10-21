import {publicMedia} from '../../../../../../../lib/integrated-phase-a4-runtime.mjs';
import {errorResponse} from '../../../../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}={}){try{const {eventId,slot}=await params;return await publicMedia(eventId,slot);}catch(error){return errorResponse(error);}}
