import {publicVersionMedia} from '../../../../../../../../../lib/integrated-phase-a4-runtime.mjs';
import {errorResponse} from '../../../../../../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}={}){try{const {eventId,version,slot}=await params;return await publicVersionMedia(eventId,version,slot);}catch(error){return errorResponse(error);}}
