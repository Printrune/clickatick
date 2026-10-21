import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {creatorNeonCutoverEnabled,legacyPublishingClosedResponse} from '../lib/creator-neon-cutover.mjs';

const routes={
  'demo/listings/route.js':['POST'],
  'demo/listings/[id]/checkout/route.js':['POST'],
  'demo/listings/[id]/artwork/route.js':['POST'],
  'marketing/[id]/route.js':['POST','DELETE'],
  'marketing/[id]/refine/route.js':['POST'],
  'marketing/[id]/approve/route.js':['POST'],
  'listings/route.js':['POST'],
  'auth/route.js':['POST','DELETE'],
};

test('cutover is explicit, server-only and returns the legacy recovery envelope',async()=>{
  assert.equal(creatorNeonCutoverEnabled({}),false);
  assert.equal(creatorNeonCutoverEnabled({CREATOR_NEON_CUTOVER_ENABLED:'false'}),false);
  assert.equal(creatorNeonCutoverEnabled({CREATOR_NEON_CUTOVER_ENABLED:'true'}),true);
  const response=legacyPublishingClosedResponse();
  assert.equal(response.status,410);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{error:'Save this draft to a brand to publish it after review.',code:'LEGACY_PUBLISHING_CLOSED',saveDraftUrl:'/dashboard?source=creator'});
});

test('every legacy mutation checks the cutover before any request or service work',async()=>{
  for(const [name,methods] of Object.entries(routes)){
    const source=await readFile(new URL(`../app/api/${name}`,import.meta.url),'utf8');
    assert.match(source,/import \{creatorNeonCutoverEnabled,legacyPublishingClosedResponse\}/,name);
    for(const method of methods){
      const signature=new RegExp(`export async function ${method}\\(request(?:,\\{params\\})?\\)\\s*\\{if\\(creatorNeonCutoverEnabled\\(\\)\\)return legacyPublishingClosedResponse\\(\\);`);
      assert.match(source,signature,`${method} ${name}`);
    }
  }
  const marketing=await readFile(new URL('../app/api/marketing/[id]/route.js',import.meta.url),'utf8');
  assert.match(marketing,/export async function GET/);
  assert.doesNotMatch(marketing,/export async function GET[^\n]*creatorNeonCutoverEnabled/);
});

test('cutover closes every legacy mutation before request parsing or service calls',async()=>{
  const previous=process.env.CREATOR_NEON_CUTOVER_ENABLED;
  process.env.CREATOR_NEON_CUTOVER_ENABLED='true';
  try{
    for(const [name,methods] of Object.entries(routes)){
      let source=await readFile(new URL(`../app/api/${name}`,import.meta.url),'utf8');
      source=source.replace(/^import .*;\r?\n/gm,'');
      source=`import {creatorNeonCutoverEnabled,legacyPublishingClosedResponse} from '${new URL('../lib/creator-neon-cutover.mjs',import.meta.url).href}';\n`+source;
      const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
      for(const method of methods){
        const response=await module[method](undefined,{});
        assert.equal(response.status,410,`${method} ${name}`);
        assert.equal((await response.json()).code,'LEGACY_PUBLISHING_CLOSED',`${method} ${name}`);
      }
    }
  }finally{
    if(previous===undefined)delete process.env.CREATOR_NEON_CUTOVER_ENABLED;
    else process.env.CREATOR_NEON_CUTOVER_ENABLED=previous;
  }
});
