// Isolated route rehearsal. Every network request is intercepted below.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {emptyListing} from '../lib/listing.mjs';

const data = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const servicesSource = await readFile(new URL('../lib/services.js', import.meta.url), 'utf8');
globalThis.__cookies = () => ({get: () => ({value: 'user-token'})});
const localStoreURL=JSON.stringify(new URL('../lib/local-store.mjs',import.meta.url).href);
const servicesURL = data(servicesSource.replace("import { cookies,headers } from 'next/headers';", 'const cookies=globalThis.__cookies;const headers=async()=>new Headers();').replace("'./local-store.mjs'",localStoreURL).replace("'./claude-ai.mjs'",JSON.stringify(new URL('../lib/claude-ai.mjs',import.meta.url).href)).replace("'./speech-server.mjs'",JSON.stringify(new URL('../lib/speech-server.mjs',import.meta.url).href)).replace("'./demo-service.mjs'",JSON.stringify(new URL('../lib/demo-service.mjs',import.meta.url).href)));
const {connections,sameOrigin} = await import(servicesURL);
assert.equal(sameOrigin(new Request('http://localhost:3021/api/listings',{headers:{host:'127.0.0.1:3021',origin:'http://127.0.0.1:3021'}})),true);
assert.equal(sameOrigin(new Request('http://localhost:3021/api/listings',{headers:{host:'127.0.0.1:3021',origin:'http://other.invalid'}})),false);
assert.equal(sameOrigin(new Request('http://localhost:3021/api/listings',{headers:{host:'127.0.0.1:3021'}})),false);
Object.assign(process.env, {
  AI_PROVIDER:'anthropic',ANTHROPIC_API_KEY:'stub',ANTHROPIC_BUDGET_CONFIRMED:'true',AI_MODEL:'claude-haiku-4-5-20251001',LOCAL_MODE:'false',
  SUPABASE_URL: 'https://database.invalid', SUPABASE_ANON_KEY: 'anon-stub',
  SUPABASE_SERVICE_ROLE_KEY: 'server-stub'
});
delete process.env.AI_ENABLED;
delete process.env.PUBLISHING_ENABLED;
assert.deepEqual(connections(), {ai: false, publishing: false});
process.env.AI_ENABLED = 'true';
process.env.PUBLISHING_ENABLED = 'true';
assert.deepEqual(connections(), {ai: true, publishing: true});
process.env.ANTHROPIC_BUDGET_CONFIRMED='false';
assert.deepEqual(connections(), {ai: false, publishing: true});
process.env.ANTHROPIC_BUDGET_CONFIRMED='true';
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.deepEqual(connections(), {ai: true, publishing: false});
process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-stub';

let calls = [], mode = 'ok';
globalThis.fetch = async (url, options) => {
  calls.push({url, options});
  if (url.endsWith('/auth/v1/user')) {
    return Response.json(mode === 'expired' ? {} : {id: 'owner-from-session'}, {status: mode === 'expired' ? 401 : 200});
  }
  if (mode === 'denied') return Response.json({message: 'ownership error'}, {status: 403});
  return Response.json('a1111111-1111-4111-8111-111111111111');
};
let route = await readFile(new URL('../app/api/listings/route.js', import.meta.url), 'utf8');
route = route.replace("'../../../lib/listing.mjs'", JSON.stringify(new URL('../lib/listing.mjs', import.meta.url).href))
  .replace("'../../../lib/services'", JSON.stringify(servicesURL))
  .replace("'../../../lib/event-system.mjs'", JSON.stringify(new URL('../lib/event-system.mjs',import.meta.url).href))
  .replace("'../../../lib/local-store.mjs'",localStoreURL);
const {POST} = await import(data(route));
const id = 'a1111111-1111-4111-8111-111111111111';
const draft = {
  ...emptyListing(), title: 'Class', description: 'Learn pottery.', location: 'Studio', price: '0', capacity: '12',
  schedule: {...emptyListing().schedule, dates: ['2026-11-07T10:00']}
};
const request = (body, origin = 'https://ticketnest.invalid') => new Request('https://ticketnest.invalid/api/listings', {
  method: 'POST', headers: {origin, host:'ticketnest.invalid', 'Content-Type': 'application/json'}, body: JSON.stringify(body)
});
assert.equal((await POST(request({id, draft}, 'https://other.invalid'))).status, 403);
assert.equal(calls.length, 0);
process.env.PUBLISHING_ENABLED = 'false';
assert.equal((await POST(request({id, draft}))).status, 503);
assert.equal(calls.length, 0);
process.env.PUBLISHING_ENABLED = 'true';
mode = 'expired';
assert.equal((await POST(request({id, draft}))).status, 401);
assert.equal(calls.length, 1);
mode = 'ok'; calls = [];
assert.equal((await POST(request({id, draft: emptyListing()}))).status, 400);
assert.equal(calls.length, 1);
calls = [];
assert.equal((await POST(request({id: 'bad', draft}))).status, 400);
assert.equal(calls.length, 1);
calls = [];
const response = await POST(request({id, draft, owner_id: 'attacker'}));
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), {url: '/listing/' + id});
assert.equal(calls.length, 2);
assert.ok(calls[1].url.endsWith('/rest/v1/rpc/publish_event_draft'));
assert.equal(calls[1].options.headers.apikey, 'server-stub');
assert.equal(calls[1].options.headers.Authorization, 'Bearer server-stub');
assert.deepEqual(JSON.parse(calls[1].options.body), {event_id: id, event_draft: draft, event_owner: 'owner-from-session'});
mode = 'denied';
assert.equal((await POST(request({id, draft}))).status, 400);
console.log('PASS: activation gates, publication origin/session/validation, verified-owner RPC payload, service credentials, storage rejection. All fetches mocked.');

