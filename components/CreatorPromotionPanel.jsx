'use client';
import {useEffect,useState} from 'react';
import {promotionUrl} from '../lib/promotion-assets.mjs';
import MarketingDashboardPreview from './MarketingDashboardPreview';
export default function CreatorPromotionPanel({listingId}){
 const [owner,setOwner]=useState(false),[listing,setListing]=useState(null),[message,setMessage]=useState(''),[url,setUrl]=useState(''),[imageBusy,setImageBusy]=useState(false),[imageMessage,setImageMessage]=useState('');
 useEffect(()=>{const controller=new AbortController();setUrl(promotionUrl(listingId));fetch(`/api/marketing/${listingId}`,{cache:'no-store',signal:controller.signal}).then(async response=>{if(response.ok){const data=await response.json();setListing(data.listing);setOwner(true);}}).catch(()=>{});return()=>controller.abort();},[listingId]);
 if(!owner)return null;
 async function copy(){try{await navigator.clipboard.writeText(url);setMessage('Link copied.');}catch{setMessage('Select and copy the link below.');}}
 async function generateImage(){if(imageBusy)return;setImageBusy(true);setImageMessage('');try{
  const key=`clickatick-artwork-request-${listingId}`;let id=localStorage.getItem(key);if(!id){id=crypto.randomUUID();localStorage.setItem(key,id);}
  const response=await fetch(`/api/demo/listings/${listingId}/artwork`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Image generation is unavailable.');
  if(!result.coverImage?.dataUrl)throw new Error('No event image was returned.');
  window.location.reload();
 }catch(error){setImageMessage(error.message||'Image generation is unavailable.');}finally{setImageBusy(false);}}
 return <aside className="creator-promotion" aria-label="Creator tools"><div><h2>Ready to share?</h2><p>Build a post or poster from these event details.</p></div><div className="creator-promotion-actions"><button type="button" onClick={copy}>Copy link</button><a className="marketing-primary" href={`/listing/${listingId}/marketing`}>Promote this event ↗</a></div><input aria-label="Public listing link" readOnly value={url} onFocus={event=>event.target.select()}/><p role="status">{message}</p><div className="creator-artwork-action"><button type="button" onClick={generateImage} disabled={imageBusy}>{imageBusy?'Preparing image…':'Generate realistic image'}</button><p>Optional. The current illustration stays in place if image generation is unavailable.</p><p role="status">{imageMessage}</p></div><MarketingDashboardPreview listingId={listingId} listing={listing}/></aside>;
}

