import {codeList,codeCreate} from '../../../../../../../../lib/integrated-promotions-http.mjs';
export const GET=(request,{params})=>codeList(request,params,'referral');
export const POST=(request,{params})=>codeCreate(request,params,'referral');
