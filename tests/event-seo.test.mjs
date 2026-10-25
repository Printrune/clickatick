import test from 'node:test';
import assert from 'node:assert/strict';
import {partnerEventSchema,ownEventSchema,safeJsonLd} from '../lib/event-seo.mjs';

test('partner schema describes only a dated, located event without invented ticket offers',()=>{
  const event={title:'Autumn Walk',localDate:'2026-11-02',localTime:'18:00:00',venue:'Town Hall',address:'10 Main St, Denver, CO',streetAddress:'10 Main St',city:'Denver',state:'CO',country:'US',status:'onsale'};
  const schema=partnerEventSchema(event,'https://clickatick.com/partner-events/abc');
  assert.equal(schema.startDate,'2026-11-02T18:00:00');
  assert.equal(schema.location.address.addressLocality,'Denver');
  assert.equal(schema.offers,undefined);
  assert.equal(partnerEventSchema({...event,localDate:null},'https://clickatick.com/partner-events/abc'),null);
});

test('own event schema omits simulated ticket offers and escapes script content',()=>{
  const event={status:'published',title:'Walking tour <script>',description:'A guided walk',location:{name:'Town Hall',address:'10 Main St, Denver, CO',latitude:39.7,longitude:-104.9},nextOccurrence:{id:'one',startsAtUtc:'2026-11-02T18:00:00Z'},occurrences:[{id:'one',endsAtUtc:'2026-11-02T19:00:00Z'}],coverImageUrl:'/api/cover'};
  const schema=ownEventSchema(event,'https://clickatick.com/events/one');
  assert.equal(schema.image[0],'https://clickatick.com/api/cover');
  assert.equal(schema.offers,undefined);
  assert.doesNotMatch(safeJsonLd(schema),/<script>/);
  assert.match(safeJsonLd(schema),/\\u003cscript>/);
});
