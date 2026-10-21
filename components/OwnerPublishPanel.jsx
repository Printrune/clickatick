'use client';
import {useState} from 'react';
import Link from 'next/link';

const keyName=(organizerId,eventId,version)=>`clickatick-publish-${organizerId}-${eventId}-${version}`;
function publishKey(organizerId,eventId,version){try{const name=keyName(organizerId,eventId,version),stored=sessionStorage.getItem(name);if(stored)return stored;const key=crypto.randomUUID();sessionStorage.setItem(name,key);return key;}catch{return crypto.randomUUID();}}

export default function OwnerPublishPanel({organizerId,record,hasUnsavedChanges,onRefresh}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[fields,setFields]=useState([]),[url,setUrl]=useState('');
 if(!record)return null;
 const missing=record.completeness?.missingCount??null;
 async function publish(){if(busy||hasUnsavedChanges)return;setBusy(true);setMessage('');setFields([]);try{const response=await fetch(`/api/v1/organizers/${organizerId}/events/${record.id}/publish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedVersion:record.version,idempotencyKey:publishKey(organizerId,record.id,record.version)})});const result=await response.json();if(!response.ok){if(result.error?.publicUrl)setUrl(result.error.publicUrl);setFields(result.error?.fields||[]);if(['STALE_VERSION','PUBLISHED_LOCKED'].includes(result.error?.code))onRefresh?.();throw new Error(result.error?.message||`Publishing is unavailable (${response.status}).`);}try{sessionStorage.removeItem(keyName(organizerId,record.id,record.version));}catch{}window.location.assign(`/dashboard/${organizerId}/published-events/${result.data.event.id}`);}catch(error){setMessage(error.message||'Could not publish. Your draft is unchanged.');}finally{setBusy(false);}}
 return <section className="owner-publish"><h2>Review and publish</h2><p>Publishing locks this draft. The public page offers a demo checkout only. It does not sell or reserve tickets.</p>{hasUnsavedChanges&&<p role="status">Save your changes before publishing.</p>}{missing!==null&&<p>{missing===0?'This draft has no known missing details.':`${missing} details need review. Save your changes before publishing.`}</p>}{fields.length>0&&<ul>{fields.map((field,index)=><li key={`${field.path}-${index}`}><strong>{field.path}</strong>: {field.message}</li>)}</ul>}{message&&<p role="status">{message}</p>}{url?<Link href={url}>View public event</Link>:<button type="button" disabled={busy||hasUnsavedChanges} onClick={publish}>{busy?'Publishing…':'Publish event'}</button>}</section>;
}
