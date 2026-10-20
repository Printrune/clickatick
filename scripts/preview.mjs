import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
const root=process.cwd();
async function available(port){return new Promise(resolve=>{const server=net.createServer();server.once('error',()=>resolve(false));server.listen(port,'127.0.0.1',()=>server.close(()=>resolve(true)));});}
let port=3021;while(!await available(port))port++;
fs.mkdirSync('evidence',{recursive:true});
fs.writeFileSync('evidence/preview-process.json',JSON.stringify({pid:process.pid,command:`node scripts/preview.mjs (next start --hostname 127.0.0.1 --port ${port})`,workingFolder:root,port,startedAt:new Date().toISOString()},null,2));
process.argv=[process.execPath,path.resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)];
await import('../node_modules/next/dist/bin/next');
