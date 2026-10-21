import {mediaV6ClientUpload} from '../../../../../../../lib/integrated-phase-a3-media-v6-runtime.mjs';
import {mediaErrorResponse} from '../../../../../../../lib/integrated-phase-a3-media.mjs';
export const runtime='nodejs';
export async function POST(request,{params}){try{const {organizerId}=await params;return Response.json(await mediaV6ClientUpload(organizerId,request));}catch(error){return mediaErrorResponse(error);}}
