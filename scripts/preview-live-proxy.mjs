import http from 'node:http';
import fs from 'node:fs';

// Test the public deployed build from a fresh browser origin without resetting its saved draft.
// This loopback-only proxy never changes production protection or forwards unrelated cookies.
const origin='https://ticketnest-psi.vercel.app',port=Number(process.argv[2]||3040),issued=new Set();
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid test port');
const server=http.createServer(async(req,res)=>{
 try{
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>2200000){res.writeHead(413);res.end('Test request too large');return;}chunks.push(chunk);}
  const headers={};
  for(const [name,value]of Object.entries(req.headers))if(value&&!['host','cookie','origin','connection','accept-encoding','content-length'].includes(name))headers[name]=value;
  if(req.headers.origin)headers.origin=origin;
  const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(x=>issued.has(x.split('=')[0])).join('; ');
  if(cookie)headers.cookie=cookie;
  const upstream=await fetch(new URL(req.url,origin),{method:req.method,headers,...(chunks.length?{body:Buffer.concat(chunks)}:{}),redirect:'manual',signal:AbortSignal.timeout(65000)});
  const outgoing={};for(const [name,value]of upstream.headers)if(!['set-cookie','content-encoding','content-length','transfer-encoding','connection'].includes(name))outgoing[name]=value;
  const cookies=upstream.headers.getSetCookie().filter(x=>/^ct_creator_[0-9a-f-]+=/.test(x));
  if(cookies.length){for(const cookie of cookies)issued.add(cookie.split('=')[0]);outgoing['set-cookie']=cookies.map(x=>x.replace(/;\s*Secure(?=;|$)/ig,''));}
  outgoing['cache-control']='no-store';
  res.writeHead(upstream.status,outgoing);res.end(Buffer.from(await upstream.arrayBuffer()));
 }catch{if(!res.headersSent)res.writeHead(502);res.end('The deployed test page could not be reached.');}
});
server.listen(port,'127.0.0.1',()=>{
 fs.mkdirSync('evidence',{recursive:true});fs.writeFileSync('evidence/preview-live-proxy-process.json',JSON.stringify({pid:process.pid,port,origin,command:`node scripts/preview-live-proxy.mjs ${port}`,workingFolder:process.cwd(),startedAt:new Date().toISOString()},null,2));
 console.log(`Task-owned public-build test proxy: http://127.0.0.1:${port}`);
});
