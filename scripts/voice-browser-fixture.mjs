import fs from 'node:fs';
const target='app/dev-voice-check/page.jsx';
if(process.argv.includes('--install')){fs.mkdirSync('app/dev-voice-check',{recursive:true});fs.copyFileSync('frontend/fixtures/voice/page.jsx.txt',target);console.log('Installed labelled simulated voice fixture at /dev-voice-check?start=1. No microphone or paid AI is used.');}
else {if(fs.existsSync(target))fs.unlinkSync(target);if(fs.existsSync('app/dev-voice-check'))fs.rmdirSync('app/dev-voice-check');console.log('Removed development voice fixture.');}
