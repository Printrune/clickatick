import {mediaV6PrivateVideo} from '../../../../../../../../lib/integrated-phase-a3-media-v6-runtime.mjs';
import {mediaErrorResponse} from '../../../../../../../../lib/integrated-phase-a3-media.mjs';
export const runtime='nodejs';
async function serve(request,{params}){try{const {organizerId,assetId}=await params;return await mediaV6PrivateVideo(organizerId,assetId,request);}catch(error){return mediaErrorResponse(error);}}
export const GET=serve;
export const HEAD=serve;
