import * as a5 from '../../../../../../lib/integrated-phase-a5.mjs';
import {jsonResponse,errorResponse} from '../../../../../../lib/integrated-phase-a1.mjs';
export async function POST(request,{params}={}){try{const {organizerId,invitationId,membershipId,token}=await params;return jsonResponse(await a5.acceptInvitation(token,request),200);}catch(error){return errorResponse(error);}}

