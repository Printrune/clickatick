import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/conditional-media-reconcile.mjs',import.meta.url));
const run=extra=>spawnSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,CLICKATICK_RECONCILE_MEDIA_STORE:'false',...extra}});

test('private media build scan is opt-in and preview-only',()=>{
 assert.equal(run({}).status,0);
 const production=run({CLICKATICK_RECONCILE_MEDIA_STORE:'true',VERCEL_ENV:'production'});
 assert.notEqual(production.status,0);
 assert.match(production.stderr,/only in a Vercel preview build/);
 const mismatch=run({CLICKATICK_RECONCILE_MEDIA_STORE:'true',VERCEL_ENV:'preview',BLOB_STORE_ID:'one',MEDIA_BLOB_STORE_ID:'one'});
 assert.notEqual(mismatch.status,0);
 assert.match(mismatch.stderr,/live media store must be separate/);
});
