import * as a5 from '../../../../../../../lib/integrated-phase-a5.mjs';
import {jsonResponse,errorResponse} from '../../../../../../../lib/integrated-phase-a1.mjs';
export async function PATCH(request,{params}={}){try{const {organizerId,invitationId,membershipId,token}=await params;return jsonResponse(await a5.patchMembership(organizerId,membershipId,request),200);}catch(error){return errorResponse(error);}}

