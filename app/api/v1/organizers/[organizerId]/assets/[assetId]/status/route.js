import {mediaV6Status} from '../../../../../../../../lib/integrated-phase-a3-media-v6-runtime.mjs';
import {mediaJson,mediaErrorResponse} from '../../../../../../../../lib/integrated-phase-a3-media.mjs';
export const runtime='nodejs';
export async function GET(_request,{params}){try{const {organizerId,assetId}=await params;return mediaJson(await mediaV6Status(organizerId,assetId));}catch(error){return mediaErrorResponse(error);}}
