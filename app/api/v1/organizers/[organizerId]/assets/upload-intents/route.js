import {mediaV6CreateIntent} from '../../../../../../../lib/integrated-phase-a3-media-v6-runtime.mjs';
import {mediaJson,mediaErrorResponse} from '../../../../../../../lib/integrated-phase-a3-media.mjs';
export const runtime='nodejs';
export async function POST(request,{params}){try{const {organizerId}=await params;return mediaJson(await mediaV6CreateIntent(organizerId,request),201);}catch(error){return mediaErrorResponse(error);}}
