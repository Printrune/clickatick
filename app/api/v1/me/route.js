import {phaseA1} from '../../../../lib/integrated-phase-a1-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../lib/integrated-phase-a1.mjs';
export async function GET(){try{return jsonResponse(await phaseA1.me());}catch(error){return errorResponse(error);}}
