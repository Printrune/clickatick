import {spawn} from 'node:child_process';

if(process.env.CLICKATICK_APPLY_FRESH_SCHEMA!=='true')process.exit(0);
if(process.env.VERCEL_ENV!=='preview')throw new Error('Neon schema setup is permitted only in a Vercel preview build.');
const url=process.env.DATABASE_URL_UNPOOLED;
if(!url)throw new Error('Neon unpooled database URL is missing.');

const run=mode=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['backend/migrate-neon.mjs',mode],{stdio:['pipe','pipe','pipe']});
 let output='',error='';
 child.stdout.setEncoding('utf8');
 child.stderr.setEncoding('utf8');
 child.stdout.on('data',chunk=>{output+=chunk});
 child.stderr.on('data',chunk=>{error+=chunk});
 child.on('error',reject);
 child.on('close',code=>code===0?resolve(output):reject(new Error(error.trim()||`Neon ${mode} failed.`)));
 child.stdin.end(`${url}\n`);
});

const inspection=JSON.parse((await run('inspect')).trim());
if(inspection.tables===0&&inspection.applied.length===0&&inspection.pending.length===8){
 process.stdout.write('Fresh Neon database confirmed. Applying eight migrations.\n');
}else if(inspection.applied.length===7&&inspection.pending.length===1&&inspection.pending[0]==='008_integrated_promotions_referrals.sql'){
 process.stdout.write('Seven-migration ledger found. Applying the promotions migration.\n');
}else if(inspection.applied.length===8&&inspection.pending.length===0){
 process.stdout.write('Existing eight-migration ledger found. Verifying hashes.\n');
}else{
 throw new Error('Neon schema is neither fresh nor fully migrated. Manual inspection is required.');
}
process.stdout.write(await run('apply'));
