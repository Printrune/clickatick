import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneModel,sceneTheme,changedSceneFacts,CROWD_PLACES,avatarStyle,appendSceneAnswer} from '../lib/scene-model.mjs';

test('a combined Halloween tour keeps both confirmed motifs',()=>{
  const scene=sceneModel({title:'Halloween guided walking tour',capacity:20,ticketFormat:'digital',location:'Boston',schedule:{time:'19:00'},duration:90});
  assert.deepEqual(scene.cues,['halloween','tour']);
  assert.equal(scene.guests.length,20);
  assert.ok(scene.guests.every(guest=>guest.format==='digital'));
  assert.equal(scene.light,'evening');
  assert.equal(scene.facts.time,'7:00 pm');
  assert.equal(scene.facts.duration,'90 min');
  assert.equal(scene.outdoors,false);
});
test('words, negative statements and unknown details do not invent scenes',()=>{
  assert.equal(sceneTheme({title:'Dinner with my husband'}),'food');
  assert.equal(sceneTheme({title:'A meetup',description:'No music or pottery.'}),'idea');
  const generic=sceneModel({title:'A creative workshop'});
  assert.equal(generic.pottery,false);
  assert.equal(generic.light,'neutral');
  assert.equal(generic.indoors,false);
  assert.equal(generic.outdoors,false);
});
test('capacity updates retain guest identity, position and floor contact',()=>{
  const small=sceneModel({capacity:3});
  const large=sceneModel({capacity:20});
  assert.deepEqual(large.guests.slice(0,3),small.guests);
  assert.equal(sceneModel({capacity:1000}).guests.length,20);
  assert.equal(sceneModel({capacity:-1}).count,0);
  assert.equal(sceneModel({capacity:'oops'}).count,0);
  assert.equal(sceneModel({capacity:2.5}).count,0);
  for(const point of CROWD_PLACES) assert.ok(((point.x-323)/285)**2+((point.y-336)/88)**2<1,`guest ${point.x},${point.y} must be on the floor`);
});
test('both ticket formats show on guests; unknown format stays unknown',()=>{
  assert.deepEqual(sceneModel({capacity:3,ticketFormat:'both'}).guests.map(guest=>guest.format),['paper','digital','paper']);
  assert.ok(sceneModel({capacity:3}).guests.every(guest=>guest.format===''));
});
test('explicit settings and times are used without astronomical assumptions',()=>{
  assert.equal(sceneModel({title:'Garden picnic'}).outdoors,true);
  assert.equal(sceneModel({title:'Indoor painting workshop'}).indoors,true);
  assert.equal(sceneModel({title:'A workshop',description:'Not outdoors.'}).outdoors,false);
  assert.equal(sceneModel({schedule:{time:'21:15'}}).light,'night');
  assert.equal(sceneModel({schedule:{time:'09:00'}}).light,'day');
  assert.equal(sceneModel({schedule:{time:'40:00'}}).light,'neutral');
});
test('individual date-times and weekly schedules use their own accepted time',()=>{
  assert.equal(sceneModel({schedule:{kind:'dates',dates:['2026-10-31T19:00'],time:''}}).facts.time,'7:00 pm');
  assert.equal(sceneModel({schedule:{kind:'weekly',dates:['2026-10-31T19:00'],time:'09:30'}}).facts.time,'9:30 am');
  assert.equal(sceneModel({duration:60}).facts.duration,'');
  assert.equal(sceneModel({title:'One hour guided tour',duration:60}).facts.duration,'60 min');
});
test('only changed confirmed facts are highlighted',()=>{
  const before=sceneModel({capacity:20,location:'Boston'});
  const after=sceneModel({capacity:20,location:'Boston',ticketFormat:'paper',duration:90});
  assert.deepEqual(changedSceneFacts(before,after),['duration','format']);
  assert.deepEqual(changedSceneFacts(before,before),[]);
  assert.deepEqual(changedSceneFacts(null,after),[]);
});

test('calendar, clock and ticket artwork reflect actual structured fields',()=>{
  const scene=sceneModel({title:'Evening tours',schedule:{kind:'weekly',start:'2026-10-31',time:'19:30',weekdays:[2,5]},ticketTiers:[{name:'Adult',price:'15'},{name:'Child',price:'0'}]});
  assert.equal(scene.date,'Oct 31');
  assert.equal(scene.schedule,'Every Tue, Fri');
  assert.deepEqual(scene.clock,{hour:225,minute:180});
  assert.deepEqual(scene.ticketDesigns,[{name:'Adult',price:'$15'},{name:'Child',price:'Free'}]);
  assert.equal(scene.facts.tickets,'Adult $15, Child Free');
});

test('accepted answer notes preserve repeated answers and stay bounded',()=>{
  let entries=[];
  entries=appendSceneAnswer(entries,1,'Boston',['location']);
  assert.equal(entries[0].kind,'location');
  assert.equal(appendSceneAnswer(entries,1,'Boston'),entries);
  entries=appendSceneAnswer(entries,2,'Boston',[]);
  assert.equal(entries.length,2);
  assert.equal(entries[1].kind,'idea');
  entries=appendSceneAnswer(entries,3,'  Keep   it friendly  ');
  assert.equal(entries[2].text,'Keep it friendly');
  entries=appendSceneAnswer(entries,4,'x'.repeat(300));
  assert.deepEqual(entries.map(entry=>entry.revision),[2,3,4]);
  assert.equal(entries[2].text.length,120);
  assert.equal(appendSceneAnswer(entries,5,''),entries);
  assert.equal(appendSceneAnswer(entries,-1,'No accepted answer'),entries);
});

test('appearance describes bounded styling and preserves neutral fallbacks',()=>{
  const appearance=avatarStyle({skinColor:'#886644',hairColor:'url(remote)',hairStyle:'long',faceWidth:2,faceHeight:.1,gender:'ignored'});
  assert.deepEqual(appearance,{skinColor:'#886644',hairColor:'#302a42',hairStyle:'long',faceWidth:1.15,faceHeight:.85});
  assert.deepEqual(avatarStyle({faceWidth:NaN,faceHeight:Infinity}),avatarStyle());
  assert.equal(avatarStyle({hairStyle:'unknown'}).hairStyle,'short');
});

test('every relevant accepted field change is detectable without moving guests',()=>{
  const before=sceneModel({capacity:3});
  const after=sceneModel({capacity:3,title:'A talk',location:'Boston',duration:90,price:'12',schedule:{kind:'dates',dates:['2026-10-31T20:15']},ticketTiers:[{name:'General',price:'12'}]});
  assert.deepEqual(after.guests,before.guests);
  for(const field of ['title','location','duration','price','date','time','tickets']) assert.ok(changedSceneFacts(before,after).includes(field),field);
});
