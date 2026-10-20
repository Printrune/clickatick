import { cookies,headers } from 'next/headers';
import {demoPublishingReady} from './demo-service.mjs';
import {claudeReady} from './claude-ai.mjs';
import {speechCapability} from './speech-server.mjs';
import {localMode,localStore,loopbackHost} from './local-store.mjs';

export function connections() {
  const ai=claudeReady(),speech=speechCapability(),audio={...(speech?{speech}:{}),...(demoPublishingReady()?{demoPublishing:true}:{})};
  if(localMode())return {local:true,ai,publishing:true,...audio};
  return {ai,publishing:Boolean(process.env.PUBLISHING_ENABLED === 'true' && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY),...audio};
}
export async function database(path,options={},token=process.env.SUPABASE_ANON_KEY) {
  const response=await fetch(`${process.env.SUPABASE_URL}${path}`,{...options,cache:'no-store',signal:AbortSignal.timeout(15000),headers:{apikey:process.env.SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers}});
  if (!response.ok) throw new Error('The account or listing service could not complete this request. Please try again.');
  const body=await response.text();
  return body ? JSON.parse(body) : null;
}
export async function session() {
  const jar=await cookies(),token=jar.get('ticketnest-session')?.value;
  if(!token || !connections().publishing) return null;
  if(localMode()){
    if(!loopbackHost((await headers()).get('host')||''))return null;
    return (await localStore()).session(token);
  }
  try { const user=await database('/auth/v1/user',{},token);return {token,user}; } catch {return null;}
}
export function sameOrigin(request) {
  const origin=request.headers.get('origin');
  const host=request.headers.get('host');
  if(!origin||!host) return false;
  try {
    const source=new URL(origin);
    // Next.js can construct request.url using its internal listener hostname.
    // The actual Host header is the browser's destination, including its port.
    return ['http:','https:'].includes(source.protocol)&&source.host===host&&source.protocol===new URL(request.url).protocol;
  } catch {return false;}
}
