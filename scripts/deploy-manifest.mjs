import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {answerSchema,assertSchemaComplexity} from '../lib/claude-ai.mjs';
assertSchemaComplexity(answerSchema);
const files=[],assets=[];
if(fs.existsSync('app/dev-voice-check/page.jsx'))throw Error('Remove the development voice fixture before deployment.');
if(fs.existsSync('app/dev-avatar-check/page.jsx'))throw Error('Remove the development avatar fixture before deployment.');
if(fs.existsSync('app/dev-demo-check/page.jsx'))throw Error('Remove the development demo publishing fixture before deployment.');
function add(p){if(!fs.existsSync(p))return;if(fs.statSync(p).isDirectory()){for(const n of fs.readdirSync(p))add(path.join(p,n));return;}const data=fs.readFileSync(p),file=p.replaceAll('\\','/');if(/\.(png|jpg|jpeg|webp|woff2?)$/i.test(file)){const sha=createHash('sha1').update(data).digest('hex');assets.push({file,size:data.length,sha});files.push({file,sha,size:data.length});}else files.push({file,data:data.toString('base64'),encoding:'base64'});}
for(const p of ['app','components','lib','content','public','database','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','next.config.mjs'])add(p);
const chunkIndex=process.argv.indexOf('--chunk');
if(process.argv.includes('--summary'))console.log(JSON.stringify({fileCount:files.length,chunkCount:Math.ceil(files.length/12),assets}));
else if(chunkIndex>=0){const chunk=Number(process.argv[chunkIndex+1]);if(!Number.isSafeInteger(chunk)||chunk<0)throw Error('Invalid manifest chunk');console.log(JSON.stringify(files.slice(chunk*12,(chunk+1)*12)));}
else console.log(JSON.stringify({files,assets}));
