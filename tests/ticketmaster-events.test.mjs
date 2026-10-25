import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchTicketmasterEvent,fetchTicketmasterEvents,normalizeTicketmasterEvent} from '../lib/ticketmaster-events.mjs';

test('normalizes a public partner listing without exposing checkout internals',()=>{
  const event=normalizeTicketmasterEvent({id:'123',name:'Autumn Show',url:'https://www.ticketmaster.com/event/123',dates:{start:{localDate:'2026-11-01'}},_embedded:{venues:[{name:'City Hall',city:{name:'Austin'},state:{stateCode:'TX'}}]},images:[{url:'https://example.com/poster.jpg',width:300}]});
  assert.equal(event.title,'Autumn Show');
  assert.equal(event.city,'Austin');
  assert.equal(event.source,'Ticketmaster');
  assert.equal('price' in event,false);
  assert.equal(normalizeTicketmasterEvent({id:'bad',name:'Bad',url:'javascript:alert(1)'}),null);
  const tracked=normalizeTicketmasterEvent({id:'tracked',name:'Show',url:'https://ticketmaster.evyy.net/c/1/2?u=https%3A%2F%2Fwww.ticketmaster.com%2Fevent%2F123&utm_medium=affiliate'});
  assert.equal(tracked.url,'https://www.ticketmaster.com/event/123');
});

test('server fetch uses the private key and official United States event endpoint',async()=>{
  let called;
  const result=await fetchTicketmasterEvents({key:'test-private-key',fetchImpl:async url=>{called=url;return {ok:true,json:async()=>({_embedded:{events:[{id:'123',name:'Show',url:'https://www.ticketmaster.com/event/123'}]}})};}});
  assert.equal(called.hostname,'app.ticketmaster.com');
  assert.equal(called.searchParams.get('countryCode'),'US');
  assert.equal(called.searchParams.get('page'),'0');
  assert.equal(called.searchParams.get('apikey'),'test-private-key');
  assert.equal(result.events.length,1);
  assert.equal(JSON.stringify(result).includes('test-private-key'),false);
});

test('does not call Ticketmaster before a key is configured',async()=>{
  const result=await fetchTicketmasterEvents({key:'',fetchImpl:()=>{throw new Error('must not call');}});
  assert.deepEqual(result,{events:[],configured:false,nextPage:null});
});

test('requests a later page and stops at Ticketmaster’s page count',async()=>{
  let called;
  const result=await fetchTicketmasterEvents({key:'test',page:1,fetchImpl:async url=>{called=url;return {ok:true,json:async()=>({page:{totalPages:2},_embedded:{events:[{id:'2',name:'Show 2',url:'https://www.ticketmaster.com/event/2'}]}})};}});
  assert.equal(called.searchParams.get('page'),'1');
  assert.equal(result.nextPage,null);
  await assert.rejects(fetchTicketmasterEvents({key:'test',page:83}),RangeError);
});

test('reads one event for the Clickatick detail page without exposing the key',async()=>{
  let called;
  const event=await fetchTicketmasterEvent('abc-123',{key:'private-key',fetchImpl:async url=>{called=url;return {ok:true,json:async()=>({id:'abc-123',name:'Autumn Tour',url:'https://www.ticketmaster.com/event/abc-123',dates:{start:{localDate:'2026-11-01',localTime:'19:30:00'}},_embedded:{venues:[{name:'City Hall',address:{line1:'1 Main St'},city:{name:'Austin'},state:{stateCode:'TX'}}]},info:'Guided tour'})};}});
  assert.equal(called.pathname,'/discovery/v2/events/abc-123.json');
  assert.equal(event.address,'1 Main St, Austin, TX');
  assert.equal(event.localTime,'19:30:00');
  assert.equal(event.info,'Guided tour');
  assert.equal(JSON.stringify(event).includes('private-key'),false);
  assert.equal(await fetchTicketmasterEvent('../bad',{key:'private-key',fetchImpl:()=>{throw new Error('must not call');}}),null);
});
