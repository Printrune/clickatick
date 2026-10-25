import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchTicketmasterEvents,normalizeTicketmasterEvent} from '../lib/ticketmaster-events.mjs';

test('normalizes a public partner listing without exposing checkout internals',()=>{
  const event=normalizeTicketmasterEvent({id:'123',name:'Autumn Show',url:'https://www.ticketmaster.com/event/123',dates:{start:{localDate:'2026-11-01'}},_embedded:{venues:[{name:'City Hall',city:{name:'Austin'},state:{stateCode:'TX'}}]},images:[{url:'https://example.com/poster.jpg',width:300}]});
  assert.equal(event.title,'Autumn Show');
  assert.equal(event.city,'Austin');
  assert.equal(event.source,'Ticketmaster');
  assert.equal('price' in event,false);
  assert.equal(normalizeTicketmasterEvent({id:'bad',name:'Bad',url:'javascript:alert(1)'}),null);
});

test('server fetch uses the private key and official United States event endpoint',async()=>{
  let called;
  const result=await fetchTicketmasterEvents({key:'test-private-key',fetchImpl:async url=>{called=url;return {ok:true,json:async()=>({_embedded:{events:[{id:'123',name:'Show',url:'https://www.ticketmaster.com/event/123'}]}})};}});
  assert.equal(called.hostname,'app.ticketmaster.com');
  assert.equal(called.searchParams.get('countryCode'),'US');
  assert.equal(called.searchParams.get('apikey'),'test-private-key');
  assert.equal(result.events.length,1);
  assert.equal(JSON.stringify(result).includes('test-private-key'),false);
});

test('does not call Ticketmaster before a key is configured',async()=>{
  const result=await fetchTicketmasterEvents({key:'',fetchImpl:()=>{throw new Error('must not call');}});
  assert.deepEqual(result,{events:[],configured:false});
});
