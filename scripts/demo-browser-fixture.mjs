import fs from 'node:fs';
const folder='app/dev-demo-check',target=`${folder}/page.jsx`;
if(process.argv.includes('--install')){
 fs.mkdirSync(folder,{recursive:true});
 fs.copyFileSync('frontend/fixtures/demo/page.jsx.txt',target);
 console.log('Installed labelled simulated publishing fixture. Use only a fresh loopback origin.');
}else{
 if(fs.existsSync(target))fs.unlinkSync(target);
 if(fs.existsSync(folder))fs.rmdirSync(folder);
 console.log('Removed development publishing fixture.');
}
