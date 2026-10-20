import {parseListing} from './listing.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function publishedListingPath(value){const match=typeof value==='string'?value.match(/^\/listing\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i):null;if(!match||match[0]!==value)throw new Error('The listing link was not returned. Your draft is kept.');return value;}
export function savedPublishIntent(value){if(!value||!uuid.test(value.id)||!/^[a-f0-9]{64}$/.test(value.fingerprint)||value.creatorToken!==undefined&&(typeof value.creatorToken!=='string'||!/^[a-f0-9]{64}$/.test(value.creatorToken)))return null;return {id:value.id,fingerprint:value.fingerprint,...(value.creatorToken?{creatorToken:value.creatorToken}:{})};}
const newCreatorToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
export async function publicationIntent(draft,previous,createId=()=>crypto.randomUUID(),createToken=newCreatorToken){
 const bytes=new TextEncoder().encode(JSON.stringify(parseListing(draft))),digest=await crypto.subtle.digest('SHA-256',bytes);
 const fingerprint=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
 const saved=savedPublishIntent(previous);return saved?.creatorToken&&saved.fingerprint===fingerprint?saved:{id:createId(),fingerprint,creatorToken:createToken()};
}
export function checkoutIntent(content,previous,createId=()=>crypto.randomUUID()){
 const fingerprint=JSON.stringify(content);
 return previous?.fingerprint===fingerprint&&uuid.test(previous.id)?previous:{id:createId(),fingerprint};
}
