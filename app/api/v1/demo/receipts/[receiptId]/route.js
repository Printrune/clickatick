import {demoReceipt} from '../../../../../../lib/integrated-phase-a4-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}={}){try{return jsonResponse(await demoReceipt((await params).receiptId));}catch(error){return errorResponse(error);}}
