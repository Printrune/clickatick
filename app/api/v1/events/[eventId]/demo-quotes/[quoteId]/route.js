import {demoQuoteRead} from '../../../../../../../lib/integrated-phase-a4-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}={}){try{const {eventId,quoteId}=await params;return jsonResponse(await demoQuoteRead(eventId,quoteId));}catch(error){return errorResponse(error);}}
