import test from 'node:test';
import assert from 'node:assert/strict';
import {appendCatalogPage,filterLoadedEvents} from '../lib/catalog-pages.mjs';
test('cursor append deduplicates IDs and preserves old rows',()=>{const a=[{id:'1',title:'First'}],b=[{id:'1',title:'Duplicate'},{id:'2',title:'Second'}];assert.deepEqual(appendCatalogPage(a,b),[a[0],b[1]]);});
test('loaded search matches title and location without claiming unseen pages',()=>{const rows=[{id:'1',title:'Halloween Walk',description:'',type:'activity',location:{name:'Phoenix'}},{id:'2',title:'Concert',type:'event',location:{address:'Denver'}}];assert.deepEqual(filterLoadedEvents(rows,'phoenIX','activity').map(row=>row.id),['1']);assert.deepEqual(filterLoadedEvents(rows,'walk','event'),[]);});
