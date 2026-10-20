import {creatorCookie} from '../../../../lib/marketing-http.mjs';
import {sameOrigin} from '../../../../lib/services';
import {publishDemoListing} from '../../../../lib/demo-service.mjs';
import {DemoError,demoPostGuard,readDemoJson,demoErrorResponse,LISTING_BYTES} from '../../../../lib/demo-http.mjs';
export const maxDuration=60;
export async function POST(request){
 try{if(!sameOrigin(request))throw new DemoError('Please use the clickatick website.',403);demoPostGuard(request);const input=await readDemoJson(request.body,LISTING_BYTES),result=await publishDemoListing(input),{created,creatorExpiresAt,...body}=result;return Response.json(body,{status:created?201:200,headers:{'Cache-Control':'no-store',...(creatorExpiresAt?{'Set-Cookie':creatorCookie(result.id,input.creatorToken,creatorExpiresAt)}:{})}});}
 catch(error){return demoErrorResponse(error);}
}
