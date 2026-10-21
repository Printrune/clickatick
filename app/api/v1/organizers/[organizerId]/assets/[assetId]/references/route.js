import {phaseA3} from '../../../../../../../../lib/integrated-phase-a3-media-runtime.mjs';
import {mediaJson,mediaErrorResponse} from '../../../../../../../../lib/integrated-phase-a3-media.mjs';
export const runtime='nodejs';
export async function GET(request,{params}){try{const {organizerId,assetId}=await params;return mediaJson(await phaseA3.references(organizerId,assetId,new URL(request.url).searchParams));}catch(error){return mediaErrorResponse(error);}}
