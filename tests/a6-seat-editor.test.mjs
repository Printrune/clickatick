import {test} from 'node:test';
import assert from 'node:assert/strict';
import {configuredCount,seatState,changeSeat} from '../lib/a6-seat-editor.mjs';
test('sparse seat editing preserves unrelated seats and configured count',()=>{
 const original={rows:2,seatsPerRow:3,seatTierId:null,removedSeats:[],accessibleSeats:[],seatOverrides:[]};
 const marked=changeSeat(original,1,2,'accessible',true);
 const removed=changeSeat(marked,2,3,'removed',true);
 assert.equal(configuredCount(removed),5);
 assert.equal(seatState(removed,1,2).accessible,true);
 assert.equal(seatState(removed,2,3).removed,true);
 assert.equal(seatState(original,1,2).accessible,false);
});
test('removing a seat clears its accessibility and tier override',()=>{
 const original={rows:1,seatsPerRow:2,seatTierId:null,removedSeats:[],accessibleSeats:[{row:1,number:1}],seatOverrides:[{row:1,number:1,seatTierId:'tier'}]};
 const next=changeSeat(original,1,1,'removed',true);
 assert.deepEqual(next.accessibleSeats,[]);
 assert.deepEqual(next.seatOverrides,[]);
});
test('an explicit null seat override clears a section ticket restriction',()=>{
 const section={rows:1,seatsPerRow:1,seatTierId:'tier-a',seatOverrides:[{row:1,number:1,seatTierId:null}]};
 assert.equal(seatState(section,1,1).tierId,null);
});
