import {mediaV6List,mediaV6IntentsUnavailable} from '../../../../../../lib/integrated-phase-a3-media-v6-runtime.mjs';
import {mediaJson,mediaErrorResponse} from '../../../../../../lib/integrated-phase-a3-media.mjs';
export const runtime='nodejs';
export async function GET(request,{params}){try{const {organizerId}=await params;return mediaJson(await mediaV6List(organizerId,new URL(request.url).searchParams));}catch(error){return mediaErrorResponse(error);}}
export async function POST(){try{return mediaJson(await mediaV6IntentsUnavailable());}catch(error){return mediaErrorResponse(error);}}
