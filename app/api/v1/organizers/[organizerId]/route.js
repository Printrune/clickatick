import {phaseA1} from '../../../../../lib/integrated-phase-a1-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}){try{const {organizerId}=await params;return jsonResponse(await phaseA1.brand(organizerId));}catch(error){return errorResponse(error);}}
