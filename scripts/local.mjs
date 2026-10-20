import {spawn} from 'node:child_process';
process.env.LOCAL_MODE='true';
if(process.env.VERCEL)throw new Error('Local mode cannot run on Vercel.');
const build=spawn(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit',env:process.env});
const code=await new Promise(resolve=>{build.on('error',()=>resolve(1));build.on('exit',resolve);});
if(code!==0)process.exit(code||1);
await import('./preview.mjs');
