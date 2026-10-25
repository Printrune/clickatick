'use client';
import {useEffect,useState} from 'react';

export default function SaveEventButton({source,id}){
  const [state,setState]=useState('loading'),[error,setError]=useState('');
  useEffect(()=>{let active=true;fetch('/api/planner',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(body=>{if(active)setState(body?.items?.some(item=>item.source===source&&item.id===id)?'saved':'ready');}).catch(()=>{if(active)setState('ready');});return()=>{active=false;};},[source,id]);
  async function save(){if(state!=='ready')return;setState('saving');setError('');try{const response=await fetch('/api/planner',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source,id})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Could not save this event.');setState('saved');}catch(failure){setState('ready');setError(failure.message);}}
  return <span className="event-save-wrap"><button type="button" className="event-save-button" disabled={state!=='ready'} onClick={save}>{state==='saved'?'Saved to planner':state==='saving'?'Saving…':state==='loading'?'Checking planner…':'Save to planner'}</button>{error&&<small role="alert">{error}</small>}</span>;
}
