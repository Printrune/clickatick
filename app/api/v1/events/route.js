import {publicCatalog} from '../../../../lib/integrated-phase-a4-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}={}){try{return jsonResponse(await publicCatalog(new URL(request.url).searchParams));}catch(error){return errorResponse(error);}}
