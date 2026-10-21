import {mediaV6ServerImageUpload} from '../../../../../../../../lib/integrated-phase-a3-media-v6-runtime.mjs';
import {mediaErrorResponse,mediaJson} from '../../../../../../../../lib/integrated-phase-a3-media.mjs';

export async function POST(request,{params}){
 try{const {organizerId,assetId}=await params;return mediaJson(await mediaV6ServerImageUpload(organizerId,assetId,request));}
 catch(error){return mediaErrorResponse(error);}
}
