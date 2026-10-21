import {mediaV6Usage} from '../../../../../../../lib/integrated-phase-a3-media-v6-runtime.mjs';
import {mediaJson,mediaErrorResponse} from '../../../../../../../lib/integrated-phase-a3-media.mjs';
export const runtime='nodejs';
export async function GET(_request,{params}){try{const {organizerId}=await params;return mediaJson(await mediaV6Usage(organizerId));}catch(error){return mediaErrorResponse(error);}}
