'use client';
import {useState} from 'react';
import {promotionUrl} from '../lib/promotion-assets.mjs';

const channels=['Facebook','Instagram','TikTok','YouTube','X','Threads','LinkedIn','Pinterest','Snapchat','WhatsApp','Telegram','Reddit','Discord','Bluesky','Mastodon','WeChat','LINE','Email','Custom channel'];
const channelTones=['violet','rose','cyan','coral','slate','violet','blue','coral','amber','mint','blue','coral','violet','blue','violet','mint','mint','amber','slate'];
const media=[
 {label:'Create social image',format:'social',tone:'rose'},
 {label:'Edit image layout',format:'poster',tone:'coral'},
 {label:'Create poster',format:'poster',tone:'amber'},
 {label:'Write video script',format:'video',tone:'blue'},
 {label:'Plan animated post',format:'video',tone:'violet'}
];
const bots=[
 {name:'Social Media Manager',specialty:'Draft an event post',mark:'↗',tone:'violet',format:'social'},
 {name:'Content Creator · Design',specialty:'Shape a poster',mark:'✦',tone:'rose',format:'poster'},
 {name:'Content Creator · Video',specialty:'Write a video script',mark:'▶',tone:'blue',format:'video'},
 {name:'Performance Marketer',specialty:'Draft an ad plan',mark:'◎',tone:'amber',format:'ad-plan'},
 {name:'Copywriter',specialty:'Edit an event caption',mark:'Aa',tone:'mint',format:'social'},
 {name:'Email Marketer',specialty:'Adapt the event message',mark:'✉',tone:'coral',format:'social'},
 {name:'Analytics Agent',specialty:'Plan a campaign',mark:'▥',tone:'cyan',format:'ad-plan'}
];
const composer=(channel,url,caption)=>{
 const u=encodeURIComponent(url),t=encodeURIComponent(caption);
 switch(channel){
  case 'Facebook':return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  case 'X':return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
  case 'LinkedIn':return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
  case 'WhatsApp':return `https://api.whatsapp.com/send?text=${encodeURIComponent(`${caption}\n${url}`)}`;
  case 'Telegram':return `https://t.me/share/url?url=${u}&text=${t}`;
  case 'Reddit':return `https://www.reddit.com/submit?url=${u}&title=${encodeURIComponent(caption)}`;
  case 'Email':return `mailto:?subject=${encodeURIComponent('An event to explore')}&body=${encodeURIComponent(`${caption}\n${url}`)}`;
  default:return null;
 }
};

export default function MarketingDashboardPreview({listingId,listing}){
 const [status,setStatus]=useState(''),[fallback,setFallback]=useState(''),[campaignSource,setCampaignSource]=useState(''),[campaignName,setCampaignName]=useState('');
 const url=promotionUrl(listingId);
 const title=listing?.draft?.title||'This event';
 const caption=`${title}\nDemo only. No real ticket or payment is created.`;
 const workspace=format=>`/listing/${listingId}/marketing?format=${format}`;
 async function copyText(value,success){
  try{await navigator.clipboard.writeText(value);setFallback('');setStatus(success);}catch{setFallback(value);setStatus('Copy was unavailable. Select the text below and copy it.');}
 }
 function share(channel){
  const target=composer(channel,url,caption);
  if(target){
   window.open(target,'_blank','noopener,noreferrer');
   setFallback('');setStatus(`${channel} share window requested. Choose whether to share there.`);return;
  }
  copyText(`${caption}\n${url}`,`${channel} caption copied. Paste it into ${channel} to share.`);
 }
 function trackedUrl(){
  const source=campaignSource.trim(),name=campaignName.trim();
  if(!source||!name){setStatus('Enter a source and campaign name first.');return;}
  const tracked=new URL(url);tracked.searchParams.set('utm_source',source.slice(0,80));tracked.searchParams.set('utm_medium','social');tracked.searchParams.set('utm_campaign',name.slice(0,80));copyText(tracked.toString(),'Campaign link copied. Tracking reports are not connected.');
 }
 return <section className="marketing-dashboard-preview" aria-labelledby="marketing-dashboard-title">
  <header className="dashboard-preview-header"><h2 id="marketing-dashboard-title">Your event’s marketing toolkit</h2><p>Open a share window, prepare a caption, or continue in your event editor. Nothing posts automatically.</p></header>
  <section className="dashboard-preview-group dashboard-preview-sharing" aria-labelledby="dashboard-sharing"><div className="dashboard-preview-group-heading"><span className="dashboard-preview-group-symbol" aria-hidden="true">↗</span><div><h3 id="dashboard-sharing">Share your event</h3><p>Choose a channel. Some open a share window; the others copy text for you to paste.</p></div></div><div className="dashboard-preview-buttons">{channels.map((channel,index)=><button key={channel} className={`dashboard-preview-button tone-${channelTones[index]}`} type="button" onClick={()=>share(channel)}><span className="dashboard-preview-icon" aria-hidden="true">↗</span><span className="dashboard-preview-copy"><strong>{channel}</strong><small>{composer(channel,url,caption)?'Open share window':'Copy caption'}</small></span></button>)}</div></section>
  <section className="dashboard-preview-group dashboard-preview-media" aria-labelledby="dashboard-media"><div className="dashboard-preview-group-heading"><span className="dashboard-preview-group-symbol" aria-hidden="true">✦</span><div><h3 id="dashboard-media">Make your marketing material</h3><p>Open an editable starter. Image downloads are SVG files; video is a script.</p></div></div><div className="dashboard-preview-buttons">{media.map(item=><a key={item.label} className={`dashboard-preview-button dashboard-preview-link tone-${item.tone}`} href={workspace(item.format)}><span className="dashboard-preview-icon" aria-hidden="true">✦</span><span className="dashboard-preview-copy"><strong>{item.label}</strong><small>Open editor</small></span></a>)}</div></section>
  <section className="dashboard-preview-group dashboard-preview-agents" aria-labelledby="dashboard-agents"><div className="dashboard-preview-group-heading"><span className="dashboard-preview-group-symbol" aria-hidden="true">◇</span><div><h3 id="dashboard-agents">Marketing bot ideas</h3><p>These bots are not connected. Open the related editor to prepare their work yourself.</p></div></div><div className="dashboard-bot-roster">{bots.map(bot=><a key={bot.name} className={`dashboard-bot tone-${bot.tone}`} href={workspace(bot.format)} aria-label={`${bot.name}. Open related editor. No bot is connected.`}><span className="dashboard-bot-avatar" aria-hidden="true">{bot.mark}</span><span className="dashboard-bot-details"><strong>{bot.name}</strong><span>{bot.specialty}</span><small>Open editor · No bot connected</small></span></a>)}</div><div className="dashboard-custom-agent"><h4>Bring your own bot</h4><p>Custom bot connections are coming later. You can edit the promotion text now.</p><a className="dashboard-custom-editor" href={workspace('social')}>Open the text editor</a><span className="dashboard-custom-unavailable">Custom bot and service connections are unavailable.</span></div></section>
  <section className="dashboard-campaign" aria-labelledby="dashboard-campaign-title"><h3 id="dashboard-campaign-title">Make a campaign link</h3><p>Add labels to the event URL so you can tell your links apart. Reports are not connected.</p><div className="dashboard-campaign-fields"><label>Source<input value={campaignSource} maxLength={80} onChange={event=>setCampaignSource(event.target.value)} placeholder="instagram"/></label><label>Campaign<input value={campaignName} maxLength={80} onChange={event=>setCampaignName(event.target.value)} placeholder="opening-week"/></label><button type="button" onClick={trackedUrl}>Copy campaign link</button></div></section>
  <p className="dashboard-tool-status" role="status">{status}</p>{fallback&&<textarea aria-label="Text to copy" readOnly value={fallback} onFocus={event=>event.target.select()} rows={4}/>}
 </section>;
}
