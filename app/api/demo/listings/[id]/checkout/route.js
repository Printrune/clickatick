import {sameOrigin} from '../../../../../../lib/services';
import {checkoutDemoListing} from '../../../../../../lib/demo-service.mjs';
import {DemoError,demoPostGuard,readDemoJson,demoErrorResponse,RECEIPT_BYTES} from '../../../../../../lib/demo-http.mjs';
export const maxDuration=60;
export async function POST(request,{params}){
 try{if(!sameOrigin(request))throw new DemoError('Please use the clickatick website.',403);demoPostGuard(request);const {id}=await params,input=await readDemoJson(request.body,RECEIPT_BYTES),result=await checkoutDemoListing(id,input),{created,...body}=result;return Response.json(body,{status:created?201:200,headers:{'Cache-Control':'no-store'}});}
 catch(error){return demoErrorResponse(error);}
}
