import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {parseBounds,geoHash,mapTicketmasterEvent,nearbyTicketmaster,nearbyClickatick} from '../lib/event-map.mjs';
import {parsePlannerEvent,plannerCookie,cookieHeader,addPlannerEvent} from '../lib/activity-planner.mjs';

test('map accepts a bounded viewport and rejects malformed, world-sized or reversed bounds',()=>{
 const area=parseBounds('-74.2,40.5,-73.8,40.9');assert.equal(area.center[1],40.7);assert.equal(geoHash(40.7,-74),'dr5rs14ye');
 for(const value of ['-180,-90,180,90','-73.8,40.5,-74.2,40.9','1,2,3','NaN,0,1,1'])assert.throws(()=>parseBounds(value));
});

test('partner map clips venue coordinates and keeps navigation on Clickatick',()=>{
 const bounds=parseBounds('-74.2,40.5,-73.8,40.9'),fixture={id:'G123',name:'Example show',url:'https://www.ticketmaster.com/example',_embedded:{venues:[{name:'Hall',city:{name:'New York'},location:{latitude:'40.70',longitude:'-74.00'}}]}};
 const event=mapTicketmasterEvent(fixture,bounds);assert.equal(event.url,'/partner-events/G123');assert.equal(event.lat,40.7);assert.equal(event.source,'ticketmaster');
 assert.equal(mapTicketmasterEvent({...fixture,_embedded:{venues:[{location:{latitude:'41',longitude:'-74'}}]}},bounds),null);
});

test('nearby partner search sends a geohash and bounded radius without returning API key',async()=>{
 let requested;const result=await nearbyTicketmaster(parseBounds('-74.2,40.5,-73.8,40.9'),{key:'private-test-key',fetchImpl:async url=>{requested=url;return {ok:true,json:async()=>({page:{totalPages:2},_embedded:{events:[]}})};}});
 assert.equal(requested.searchParams.get('geoPoint'),'dr5rs14ye');assert.equal(requested.searchParams.get('radius'),'18');assert.equal(result.nextPage,1);assert.equal(JSON.stringify(result).includes('private-test-key'),false);
});

test('planner validates references and uses a first-party opaque cookie',()=>{
 assert.deepEqual(parsePlannerEvent('ticketmaster','G123'),{source:'ticketmaster',id:'G123'});assert.throws(()=>parsePlannerEvent('ticketmaster','https://example.com'));assert.throws(()=>parsePlannerEvent('clickatick','G123'));
 const request=new Request('https://clickatick.com/api/planner',{headers:{cookie:'clickatick_planner=179967d9-f6ca-4d43-86a9-88b46929f821'}});
 assert.equal(plannerCookie(request),'179967d9-f6ca-4d43-86a9-88b46929f821');assert.match(cookieHeader('179967d9-f6ca-4d43-86a9-88b46929f821',request),/HttpOnly; SameSite=Lax; Secure/);
});

test('planner rejects excess writes before calling Ticketmaster',async()=>{
 const calls=[];const request=new Request('https://clickatick.com/api/planner',{method:'POST',headers:{origin:'https://clickatick.com',host:'clickatick.com','content-type':'application/json'},body:JSON.stringify({source:'ticketmaster',id:'G123'})});
 await assert.rejects(()=>addPlannerEvent(request,{identify:async()=>({owner:{kind:'anonymous',key:'hash'},anonymous:null,newCookie:null}),withStore:async action=>action({query:async sql=>{calls.push(sql);return {rows:[]};}}),resolveEvent:async()=>{calls.push('ticketmaster-fetch');return {};}}),{code:'RATE_LIMITED',status:429});
 assert.equal(calls.length,2);assert.equal(calls.includes('ticketmaster-fetch'),false);
});

test('own published events use the event pin and omit cancelled events',async()=>{
 const pg=new PGlite();try{await pg.exec(`CREATE TABLE public_events(id uuid PRIMARY KEY,snapshot jsonb NOT NULL,status text NOT NULL,published_at timestamptz NOT NULL DEFAULT now());`);const first='179967d9-f6ca-4d43-86a9-88b46929f821',second='279967d9-f6ca-4d43-86a9-88b46929f821',snapshot={title:'Walking tour',sameLocation:false,businessLocation:{latitude:0,longitude:0},eventLocation:{name:'City Hall',address:'New York, NY',latitude:40.7,longitude:-74},coverAssetId:null};await pg.query('INSERT INTO public_events(id,snapshot,status) VALUES($1,$2::jsonb,$3),($4,$2::jsonb,$5)',[first,JSON.stringify(snapshot),'published',second,'cancelled']);const result=await nearbyClickatick(parseBounds('-74.2,40.5,-73.8,40.9'),{query:async(sql,params)=>(await pg.query(sql,params)).rows});assert.equal(result.events.length,1);assert.equal(result.events[0].venue,'City Hall');assert.equal(result.events[0].url,`/events/${first}`);}finally{await pg.close();}
});

test('planner migration enforces one saved event per owner and supports the per-owner index',async()=>{
 const pg=new PGlite();try{await pg.exec(await readFile(new URL('../backend/migrations/009_event_planner.sql',import.meta.url),'utf8'));await pg.query(`INSERT INTO saved_events(owner_kind,owner_key,source,event_id,title,event_url) VALUES('anonymous','hash','ticketmaster','G123','Example','/partner-events/G123')`);await assert.rejects(()=>pg.query(`INSERT INTO saved_events(owner_kind,owner_key,source,event_id,title,event_url) VALUES('anonymous','hash','ticketmaster','G123','Example','/partner-events/G123')`),{code:'23505'});const rows=await pg.query(`SELECT event_id FROM saved_events WHERE owner_kind='anonymous' AND owner_key='hash'`);assert.equal(rows.rows[0].event_id,'G123');}finally{await pg.close();}
});
