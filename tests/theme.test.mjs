import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {THEME_BOOTSTRAP,THEME_STORAGE_KEY,readTheme,saveTheme,applyTheme} from '../lib/theme.mjs';
const root=()=>({dataset:{},style:{}});
test('actual pre-paint bootstrap restores the saved choice and native color scheme',()=>{
 const document={documentElement:root()};vm.runInNewContext(THEME_BOOTSTRAP,{document,localStorage:{getItem:key=>key===THEME_STORAGE_KEY?'light':null}});
 assert.equal(document.documentElement.dataset.theme,'light');assert.equal(document.documentElement.style.colorScheme,'light');
});
test('blocked storage and invalid preferences keep the original dark default without crashing',()=>{
 for(const storage of [{getItem(){throw Error('Blocked');}},{getItem:()=>'<script>bad</script>'},undefined]){const document={documentElement:root()};vm.runInNewContext(THEME_BOOTSTRAP,{document,localStorage:storage});assert.equal(document.documentElement.dataset.theme,'dark');assert.equal(readTheme(storage),'dark');}
});
test('user choice updates the current document even when saving is unavailable',()=>{
 const documentRoot=root();assert.equal(saveTheme(documentRoot,{setItem(){throw Error('Blocked');}},'light'),'light');assert.equal(documentRoot.dataset.theme,'light');assert.equal(documentRoot.style.colorScheme,'light');
 let saved;saveTheme(documentRoot,{setItem:(key,value)=>{saved=[key,value];}},'dark');assert.deepEqual(saved,[THEME_STORAGE_KEY,'dark']);assert.equal(documentRoot.dataset.theme,'dark');
});
test('cross-tab preference removal restores dark and unknown values never become document attributes',()=>{
 const documentRoot=root();applyTheme(documentRoot,'light');applyTheme(documentRoot,null);assert.equal(documentRoot.dataset.theme,'dark');applyTheme(documentRoot,'unknown');assert.equal(documentRoot.dataset.theme,'dark');
});
