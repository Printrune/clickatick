import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {answerSchema,schemaComplexity,assertSchemaComplexity,decodeProviderAnswer,claudeCompletion} from '../lib/claude-ai.mjs';
import {providerDTO} from './provider-fixture.mjs';
const env={AI_ENABLED:'true',AI_PROVIDER:'anthropic',ANTHROPIC_API_KEY:'fixture',ANTHROPIC_BUDGET_CONFIRMED:'true'};
test('actual recursively nested provider schema stays within documented14union/0optional count',()=>{
 assert.deepEqual(schemaComplexity(answerSchema),{unions:14,optional:0});assert.deepEqual(assertSchemaComplexity(answerSchema),{unions:14,optional:0});
 const visit=schema=>{if(!schema||typeof schema!=='object')return;if(schema.properties){assert.deepEqual(Object.keys(schema.properties).sort(),[...schema.required].sort());assert.equal(schema.additionalProperties,false);}for(const child of Object.values(schema))visit(child);};visit(answerSchema);
});
test('recursive guard rejects excess unions and optional parameters, counting reused descriptors per occurrence',()=>{
 const union={type:['string','null']};const nested={type:'object',required:['nested'],properties:{nested:{type:'object',properties:Object.fromEntries(Array.from({length:17},(_,i)=>[`field${i}`,union])),required:Array.from({length:17},(_,i)=>`field${i}`)}}};
 assert.equal(schemaComplexity(nested).unions,17);assert.throws(()=>assertSchemaComplexity(nested),e=>e.code==='invalid_schema');
 const optional={type:'object',properties:Object.fromEntries(Array.from({length:25},(_,i)=>[`field${i}`,{type:'string'}])),required:[]};assert.equal(schemaComplexity(optional).optional,25);assert.throws(()=>assertSchemaComplexity(optional));
});
test('complexity regression blocks actual completion before fetch and cap stays1800',async()=>{
 const props=answerSchema.properties.patch.properties;let calls=0;
 try{for(let i=0;i<3;i++)props[`regression${i}`]={type:['string','null']};await assert.rejects(claudeCompletion({system:'fixture',messages:[{role:'user',content:'hello'}]},env,async()=>{calls++;throw new Error('must not fetch');}),e=>e.code==='invalid_schema');assert.equal(calls,0);}
 finally{for(let i=0;i<3;i++)delete props[`regression${i}`];}
 const source=await readFile(new URL('../lib/claude-ai.mjs',import.meta.url),'utf8');assert.ok(source.indexOf('assertSchemaComplexity(answerSchema);')<source.indexOf("fetcher('https://api.anthropic.com/v1/messages'"));assert.match(source,/max_tokens:1800/);
});
test('compact provider DTO decodes all scalar/group families to the existing flat domain patch',()=>{
 const patch={title:'My Tour',type:'activity',price:'ten dollars',capacity:'many',sameLocation:false,supportiveMessage:true,referralEnabled:false,duration:90,ticketFormat:'digital',schedule:{kind:'dates',dates:['2026-10-29T18:00']},ticketTiers:[{id:'new-1',name:'Adult',price:'10',quantity:'20'}],paymentPreferences:['card'],clearFields:['disclaimer']};
 const dto=providerDTO({reply:'What next?',patch,sources:[],pending:[]});const decoded=decodeProviderAnswer(dto);
 for(const field of ['title','type','price','capacity','sameLocation','supportiveMessage','referralEnabled','duration','ticketFormat','paymentPreferences','clearFields'])assert.deepEqual(decoded.patch[field],patch[field]);
 assert.equal(decoded.patch.schedule.time,null);assert.equal(decoded.patch.ticketTiers[0].description,null);assert.equal(decoded.patch.text,undefined);assert.equal(decoded.patch.flags,undefined);
});
test('empty compact lists preserve unchanged fields and no legacy wide provider DTO is accepted',()=>{
 assert.deepEqual(decodeProviderAnswer(providerDTO()).patch,{clearFields:[],resolveFields:[]});
 const malformed=[{reply:'What next?',patch:{title:'Old DTO'},sources:[],pending:[]},{reply:'What next?',draft:{}},providerDTO()];malformed[2].patch.text=[{field:'price',value:'10'},{field:'price',value:'20'}];
 for(const dto of malformed)assert.throws(()=>decodeProviderAnswer(dto),e=>e.code==='invalid_response');
});
test('malformed types, unknown fields and duplicate canonical fields are explicit provider-format failures',()=>{
 for(const mutate of [dto=>{dto.patch.text=[{field:'unknown',value:'x'}]},dto=>{dto.patch.flags=[{field:'sameLocation',value:'yes'}]},dto=>{delete dto.patch.schedule},dto=>{dto.patch.schedule={dates:[]}},dto=>{dto.patch.text=[{field:'Price',value:'10'},{field:'price',value:'20'}]},dto=>{dto.patch.extra='x'},dto=>{dto.sources=[{field:'unknown',sourceText:'x'}]}]){const dto=providerDTO();mutate(dto);assert.throws(()=>decodeProviderAnswer(dto),e=>e.code==='invalid_response');}
});
test('provider enum casing canonicalizes identifiers and enum values while preserving user content',()=>{
 const dto=providerDTO();dto.patch.text=[{field:'TITLE',value:'HaLLoWeeN Tour'},{field:'TYPE',value:'EVENT'},{field:'TICKETFORMAT',value:'DIGITAL'}];dto.patch.flags=[{field:'SameLocation',value:false}];dto.patch.schedule={kind:'DATES',dates:['2026-10-29T18:00'],start:null,until:null,time:null,weekdays:null};dto.patch.paymentPreferences=['CARD','BitCoin'];dto.patch.clearFields=['Disclaimer'];dto.sources=[{field:'Title',sourceText:'HaLLoWeeN Tour'}];dto.pending=[{field:'Schedule',sourceText:'Tomorrow',question:'What time?'}];
 const decoded=decodeProviderAnswer(dto);assert.equal(decoded.patch.title,'HaLLoWeeN Tour');assert.equal(decoded.patch.type,'event');assert.equal(decoded.patch.ticketFormat,'digital');assert.equal(decoded.patch.sameLocation,false);assert.equal(decoded.patch.schedule.kind,'dates');assert.deepEqual(decoded.patch.paymentPreferences,['card','bitcoin']);assert.deepEqual(decoded.patch.clearFields,['disclaimer']);assert.equal(decoded.sources[0].field,'title');assert.equal(decoded.sources[0].sourceText,'HaLLoWeeN Tour');assert.equal(decoded.pending[0].field,'schedule');
});
