import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {demoWriteHandlers} from '../lib/integrated-phase-a4-runtime.mjs';
import {createDemoQuote,checkoutDemoQuote} from '../lib/integrated-phase-a4-demo.mjs';
import {createVersionedQuote,checkoutVersionedQuote} from '../lib/integrated-phase-a6-demo.mjs';

test('demo writes use the same event-version regime as quote and receipt reads',()=>{
  assert.deepEqual(demoWriteHandlers(false),{quote:createDemoQuote,checkout:checkoutDemoQuote});
  assert.deepEqual(demoWriteHandlers(true),{quote:createVersionedQuote,checkout:checkoutVersionedQuote});
});

test('draft seat-map route shares the stable eventId segment and maps it to draftId',async()=>{
  const route=new URL('../app/api/v1/organizers/[organizerId]/events/[eventId]/seat-map/route.js',import.meta.url);
  const source=await readFile(route,'utf8');
  assert.match(source,/eventId:draftId/);
  await assert.rejects(readFile(new URL('../app/api/v1/organizers/[organizerId]/events/[draftId]/seat-map/route.js',import.meta.url),'utf8'),{code:'ENOENT'});
});
