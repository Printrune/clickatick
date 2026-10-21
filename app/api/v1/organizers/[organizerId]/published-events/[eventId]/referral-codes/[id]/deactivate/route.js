import {codeMutate} from '../../../../../../../../../../lib/integrated-promotions-http.mjs';
export const POST=(request,{params})=>codeMutate(request,params,'referral','deactivate');
