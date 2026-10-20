import {createHash,timingSafeEqual} from 'node:crypto';
import {DemoError,demoId} from './demo-http.mjs';
export const CREATOR_DAYS=30;
export const creatorCookieName=id=>`ct_creator_${demoId(id)}`;
export function creatorHash(token){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw new DemoError('The creator access key is invalid.');return createHash('sha256').update(token).digest('hex');}
export function creatorMatches(token,hash){try{const actual=creatorHash(token);return typeof hash==='string'&&/^[a-f0-9]{64}$/.test(hash)&&timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(hash,'hex'));}catch{return false;}}
export const creatorExpires=createdAt=>new Date(Date.parse(createdAt)+CREATOR_DAYS*86400000).toISOString();
export function creatorCookie(id,token,expiresAt,secure=process.env.NODE_ENV==='production'){creatorHash(token);return `${creatorCookieName(id)}=${token}; Path=/; HttpOnly; SameSite=Strict; Expires=${new Date(expiresAt).toUTCString()}${secure?'; Secure':''}`;}
export function creatorTokenFromRequest(request,id){const name=creatorCookieName(id);return (request.headers.get('cookie')||'').split(';').map(value=>value.trim()).find(value=>value.startsWith(`${name}=`))?.slice(name.length+1)||'';}
export const MARKETING_HEADERS={'Cache-Control':'private, no-store','Vary':'Cookie'};
