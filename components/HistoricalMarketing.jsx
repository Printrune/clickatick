'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
export default function HistoricalMarketing({listingId}){
 const [state,setState]=useState('loading'),[versions,setVersions]=useState([]),[message,setMessage]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch(`/api/marketing/${listingId}`,{cache:'no-store',signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(response.status===403?'Creator access is unavailable in this browser.':body.error||'Saved promotion work is unavailable.');setVersions(Array.isArray(body.versions)?body.versions:[]);setState('ready');}).catch(error=>{if(!controller.signal.aborted){setState('error');setMessage(error.message);}});return()=>controller.abort();},[listingId]);
 return <section className="marketing-page"><header className="marketing-heading"><Link href={`/listing/${listingId}`}>← Earlier demo listing</Link><h1>Saved promotion work</h1><p>This older demo is read-only. No new artwork or promotion version can be created.</p></header>{state==='loading'?<p role="status">Loading saved work…</p>:state==='error'?<p role="alert">{message}</p>:versions.length===0?<p>No saved promotion versions were found.</p>:<div className="marketing-history">{versions.map(version=><article key={version.id}><h2>{version.draft?.kind||'Promotion'} · {version.status==='approved'?'Approved':'Saved'}</h2><p>{version.draft?.title}</p><pre>{version.draft?.caption||''}</pre></article>)}</div>}</section>;
}
