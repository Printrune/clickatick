'use client';
import {useState} from 'react';
import {initAvatarAnalyzer,analyzeAvatarCanvas} from '../../lib/avatar-client.mjs';
import EventScene from '../../components/EventScene';
const draft={title:'Halloween guided tour',description:'Ghost stories on a guided walk',location:'Boston',capacity:'20',price:'15',ticketFormat:'digital',duration:90,schedule:{kind:'dates',dates:['2026-10-31T19:00']},ticketTiers:[]};
export default function AvatarCheck(){
 const [status,setStatus]=useState('Not run'),[appearance,setAppearance]=useState(null),[revision,setRevision]=useState(0);
 async function initialize(){setStatus('Initializing official local model');try{await initAvatarAnalyzer();setStatus('Model initialization passed');}catch(e){setStatus(`Model initialization failed: ${e.code||e.message}`);}}
 async function analyze(){setStatus('Analyzing official public fixture locally');try{const image=new Image();image.src='/dev-avatar-check/fixture';await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);const result=await analyzeAvatarCanvas(canvas);setAppearance(result);setStatus(`Fixture passed: ${JSON.stringify(result)}; canvas cleared ${canvas.width===0}`);}catch(e){setStatus(`Fixture failed: ${e.code||e.message}`);}}
 return <div style={{padding:24,color:'#eee',background:'#10182a'}}><h1>Local avatar verification fixture</h1><p>Development only. No camera access or paid request. Image pixels stay local and are not displayed.</p><button onClick={initialize}>Initialize model</button><button onClick={analyze}>Analyze public fixture</button><button onClick={()=>setRevision(n=>n+1)}>Accept fixture answer</button><p role="status">{status}</p><div style={{height:650,maxWidth:850}}><EventScene draft={draft} appearance={appearance} revision={revision} answerNote={revision?'Keep our tour at twenty digital tickets.':''}/></div></div>;
}
