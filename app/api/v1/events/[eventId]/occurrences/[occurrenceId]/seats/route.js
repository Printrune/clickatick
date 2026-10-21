import {publicSeats} from '../../../../../../../../lib/integrated-phase-a4-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../../../../../lib/integrated-phase-a1.mjs';
export async function GET(request,{params}={}){try{return jsonResponse(await publicSeats((await params).eventId,(await params).occurrenceId,new URL(request.url).searchParams));}catch(error){return errorResponse(error);}}
