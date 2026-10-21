import {demoQuote} from '../../../../../../lib/integrated-phase-a4-runtime.mjs';
import {jsonResponse,errorResponse} from '../../../../../../lib/integrated-phase-a1.mjs';
export async function POST(request,{params}={}){try{const {payload,cookieToSet}=await demoQuote((await params).eventId,request);const response=jsonResponse(payload,201);if(cookieToSet)response.headers.set('Set-Cookie',`clickatick_demo=${cookieToSet}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${new URL(request.url).protocol==='https:'?'; Secure':''}`);return response;}catch(error){return errorResponse(error);}}
