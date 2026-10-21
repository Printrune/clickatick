import {phaseA3} from '../../../../../../../lib/integrated-phase-a3-media-runtime.mjs';
import {mediaV6Delete} from '../../../../../../../lib/integrated-phase-a3-media-v6-runtime.mjs';
import {mediaErrorResponse} from '../../../../../../../lib/integrated-phase-a3-media.mjs';
export const runtime='nodejs';
export async function GET(_request,{params}){try{const {organizerId,assetId}=await params;return await phaseA3.preview(organizerId,assetId);}catch(error){return mediaErrorResponse(error);}}
export async function DELETE(request,{params}){try{const {organizerId,assetId}=await params;await mediaV6Delete(organizerId,assetId,request);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});}catch(error){return mediaErrorResponse(error);}}
