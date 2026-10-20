import fs from 'node:fs/promises';
const install=process.argv.includes('--install');
const files=[['frontend/fixtures/avatar/page.jsx','app/dev-avatar-check/page.jsx'],['frontend/fixtures/avatar/route.js','app/dev-avatar-check/fixture/route.js']];
for(const [source,target] of files){if(install){await fs.mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await fs.copyFile(source,target);}else await fs.rm(target,{force:true});}
if(install){const response=await fetch('https://storage.googleapis.com/mediapipe-assets/portrait.jpg');if(!response.ok)throw Error('Official sample unavailable');await fs.mkdir('evidence',{recursive:true});await fs.writeFile('evidence/avatar-reference.jpg',Buffer.from(await response.arrayBuffer()));}
console.log(install?'Development-only fixture installed at /dev-avatar-check. Do not deploy before removing it.':'Development-only avatar fixture removed from application routes.');
