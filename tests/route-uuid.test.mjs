import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isRouteUuid} from '../lib/route-uuid.mjs';

test('organizer route accepts a canonical version-4 UUID',()=>{
 assert.equal(isRouteUuid('47e3b2a1-54bd-4c97-9d20-f16a8e13b5ca'),true);
});
test('organizer route rejects malformed and shortened IDs',()=>{
 assert.equal(isRouteUuid('47e3b2a1-54bd-4c9-9d20-f16a8e13b5ca'),false);
 assert.equal(isRouteUuid('not-an-organizer'),false);
 assert.equal(isRouteUuid(undefined),false);
});
