import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const processRecord=JSON.parse(await fs.readFile('evidence/preview-process.json','utf8'));
const origin=`http://127.0.0.1:${processRecord.port}`;
const home=await fetch(origin);
assert.equal(home.status,200);
const html=await home.text();
assert.ok(html.includes('TicketNest'));
for(const route of ['chat','auth','listings']){
  const local=await fetch(`${origin}/api/${route}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
  assert.equal(local.status,503,`${route}: external service must remain disabled`);
  const message=await local.json();assert.equal(typeof message.error,'string');
  const foreign=await fetch(`${origin}/api/${route}`,{method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/json'},body:'{}'});
  assert.equal(foreign.status,403,`${route}: reject cross-origin request`);
}
console.log('Offline preview checks passed: homepage, three disconnected routes, three cross-origin rejections. No external services called.');
