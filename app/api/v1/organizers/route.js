import {phaseA1} from '../../../../lib/integrated-phase-a1-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../lib/integrated-phase-a1.mjs';
export async function POST(request){try{return jsonResponse(await phaseA1.create(request),201);}catch(error){return errorResponse(error);}}
