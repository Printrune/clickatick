import {cookies} from 'next/headers';
import {connections,database,sameOrigin} from '../../../lib/services';
import {localMode,localRequest,localStore} from '../../../lib/local-store.mjs';
export async function POST(request) {
  if(!sameOrigin(request)) return Response.json({error:'Please use the clickatick website.'},{status:403});
  if(localMode()){
    if(!localRequest(request))return Response.json({error:'Use clickatick on this computer.'},{status:403});
    try {
      const raw=await request.text();
      if(raw.length>100||JSON.parse(raw).local!==true)return Response.json({error:'Choose the local organiser account.'},{status:400});
      const token=await(await localStore()).createSession();
      (await cookies()).set('ticketnest-session',token,{httpOnly:true,secure:false,sameSite:'strict',path:'/',maxAge:8*3600});
      return Response.json({signedIn:true});
    }catch{return Response.json({error:'The local account could not be opened.'},{status:400});}
  }
  if(!connections().publishing) return Response.json({error:'Login and publishing are not connected yet. Your draft is saved on this device.'},{status:503});
  try {
    const body=await request.json();
    if(typeof body.email!=='string'||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email)) throw new Error('Enter a valid email address.');
    if(body.code) {
      if(typeof body.code!=='string'||!/^\d{6,8}$/.test(body.code)) throw new Error('Enter the code from your email.');
      const result=await database('/auth/v1/verify',{method:'POST',body:JSON.stringify({email:body.email,token:body.code,type:'email'})});
      if(!result.access_token) throw new Error('The code could not be verified.');
      const jar=await cookies();
      jar.set('ticketnest-session',result.access_token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:Math.min(result.expires_in||3600,3600)});
      return Response.json({signedIn:true});
    }
    await database('/auth/v1/otp',{method:'POST',body:JSON.stringify({email:body.email,create_user:true})});
    return Response.json({sent:true});
  } catch {return Response.json({error:'Login could not be completed. Check your email and code, then try again.'},{status:400});}
}
export async function DELETE(request) {
  if(!sameOrigin(request)) return Response.json({error:'Please use the clickatick website.'},{status:403});
  if(localMode()){
    if(!localRequest(request))return Response.json({error:'Use clickatick on this computer.'},{status:403});
    const token=(await cookies()).get('ticketnest-session')?.value;
    await(await localStore()).revoke(token);
  }
  (await cookies()).delete('ticketnest-session');return Response.json({signedIn:false});
}
