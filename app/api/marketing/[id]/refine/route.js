import {sameOrigin} from '../../../../../lib/services';
import {marketingService} from '../../../../../lib/marketing-service.mjs';
import {creatorTokenFromRequest,MARKETING_HEADERS} from '../../../../../lib/marketing-http.mjs';
import {DemoError,demoPostGuard,readDemoJson,demoErrorResponse} from '../../../../../lib/demo-http.mjs';
export const maxDuration=60;
export async function POST(request,{params}){try{if(!sameOrigin(request))throw new DemoError('Please use the clickatick website.',403);demoPostGuard(request);const {id}=await params,input=await readDemoJson(request.body,12*1024);return Response.json(await marketingService.refine(id,creatorTokenFromRequest(request,id),input),{headers:MARKETING_HEADERS});}catch(error){const response=demoErrorResponse(error);for(const [key,value]of Object.entries(MARKETING_HEADERS))response.headers.set(key,value);return response;}}
