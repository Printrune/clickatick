import {listingFacts,DEMO_MARKETING_NOTICE} from './marketing-draft.mjs';
export const escapeSvg=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export const PUBLIC_PROMOTION_ORIGIN='https://ticketnest-psi.vercel.app';
export function promotionUrl(id){return new URL(`/listing/${id}`,PUBLIC_PROMOTION_ORIGIN).href;}
export function promotionText(listing,draft,origin=''){
 const relative=`/listing/${listing.id}`,destination=promotionUrl(listing.id,origin),body=draft.caption.split('\n').filter(line=>line.trim()!==`Try the demo booking: ${relative}`&&line.trim()!==`Try the demo booking: ${destination}`&&line.trim()!==DEMO_MARKETING_NOTICE).join('\n').trim();
 return `${body}\n\nTry the demo booking: ${destination}\n${DEMO_MARKETING_NOTICE}`;
}
function lines(value,max){const words=String(value).trim().split(/\s+/).filter(Boolean),output=[];let line='';for(let word of words){while(Array.from(word).length>max){if(line){output.push(line);line='';}output.push(Array.from(word).slice(0,max).join(''));word=Array.from(word).slice(max).join('');}if(!word)continue;if(line&&Array.from(line+' '+word).length>max){output.push(line);line=word;}else line=line?line+' '+word:word;}if(line)output.push(line);return output;}
function block(text,x,y,{size=30,width=55,color='#4c345e',weight=400,lineHeight=size*1.4}={}){const wrapped=lines(text,Math.min(width,Math.max(1,Math.floor(936/(size*1.1)))));return {height:wrapped.length*lineHeight,svg:wrapped.map((line,index)=>`<text x="${x}" y="${y+index*lineHeight}" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeSvg(line)}</text>`).join('')};}
/** Offline editable SVG. Only the organiser's validated embedded photo is used. */
export function renderPromotionSvg(listing,draft,origin=''){
 const facts=listingFacts(listing),photo=facts.photo?.dataUrl,safePhoto=typeof photo==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo),destination=promotionUrl(listing.id,origin),parts=[];let y=128;
 if(safePhoto){parts.push(`<image x="48" y="112" width="984" height="430" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-crop)" href="${escapeSvg(photo)}"/>`);y=610;}else{parts.push('<path d="M810 138h170v42a22 22 0 0 0 0 44v42H810v-42a22 22 0 0 0 0-44Z" fill="#e6d1fa" stroke="#c6a0e8" stroke-width="3"/><path d="m872 171 40 32-20 4-6 24-14-60Z" fill="#8139b9"/>');y=280;}
 const headline=block(draft.title,72,y,{size:66,width:25,color:'#4d1e72',weight:650,lineHeight:76});parts.push(headline.svg);y+=headline.height+48;
 if(draft.title!==facts.title){const title=block(facts.title,72,y,{size:30,width:52,weight:600});parts.push(title.svg);y+=title.height+24;}
 const dates=listing.draft.schedule.kind==='dates'&&listing.draft.schedule.dates.length>1?`${listing.draft.schedule.dates[0].replace('T',' at ')} (${facts.timezone}) · ${listing.draft.schedule.dates.length-1} additional dates on the listing`:facts.dateLabel;
 for(const text of [dates,facts.location,facts.priceLabel]){const item=block(text,72,y,{size:30,width:52,lineHeight:42});parts.push(item.svg);y+=item.height+22;}
 if(facts.restrictions){y+=20;parts.push(`<text x="72" y="${y}" font-size="22" font-weight="600" fill="#6c4385">Participation restrictions</text>`);y+=38;const restriction=block(facts.restrictions,72,y,{size:25,width:63,lineHeight:34});parts.push(restriction.svg);y+=restriction.height+28;}
 y+=24;parts.push(`<path d="M72 ${y}h936" stroke="#d1b8e4" stroke-width="2"/>`);y+=48;const url=block(destination,72,y,{size:24,width:65,color:'#7835aa',lineHeight:34});parts.push(`<a href="${escapeSvg(destination)}">${url.svg}</a>`);y+=url.height+42;const notice=block(DEMO_MARKETING_NOTICE,72,y,{size:24,width:62,color:'#684a79',lineHeight:34});parts.push(notice.svg);y+=notice.height+64;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${Math.max(1080,Math.ceil(y))}" viewBox="0 0 1080 ${Math.max(1080,Math.ceil(y))}" role="img" aria-label="${escapeSvg(draft.altText||facts.title)}"><title>${escapeSvg(facts.title)} · Demo event poster</title><defs><clipPath id="photo-crop"><rect x="48" y="112" width="984" height="430" rx="24"/></clipPath></defs><rect width="1080" height="100%" fill="#faf5ff"/><rect x="48" y="35" width="210" height="48" rx="24" fill="#e9daf6"/><text x="72" y="67" font-family="Arial,sans-serif" font-size="22" font-weight="600" fill="#6f319c">DEMO EVENT</text><g font-family="Arial,Segoe UI,sans-serif">${parts.join('')}</g></svg>`;
}
export function marketingRequestIntent(content,previous,createId=()=>crypto.randomUUID()){const fingerprint=JSON.stringify(content);return previous?.fingerprint===fingerprint?previous:{id:createId(),fingerprint};}


