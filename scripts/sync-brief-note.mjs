import fs from 'node:fs/promises';
const brief=JSON.parse(await fs.readFile('brief/project.json','utf8'));
const lines=[`# TicketNest shared brief, version ${brief.version}`,'',`Positioning: ${brief.positioning.status}. Product scope: ${brief.product.status}.`,'','## Business','',brief.positioning.summary,'',`Customer: ${brief.business.customer}`,`Offer: ${brief.business.offer}`,`Pricing: ${brief.business.pricing.display}`,'','## Recorded decisions','',...brief.intake.answers.map(x=>`- ${x}`),'','## Acceptance criteria','',...brief.product.acceptance.map(x=>`- ${x}`),'','## Open questions','',...brief.intake.openQuestions.map(x=>`- ${x}`),'','## Sources','',...brief.positioning.sources.map(s=>`- ${s.id}: [${s.title}](${s.url}), accessed ${s.date}.`),'','## Implementation limits','',brief.implementation.status,'The local preview is not an approved published site.'];
await fs.writeFile('brief/brief.md',lines.join('\n')+'\n');
const snapshot=`brief/brief-v${brief.version}.md`;
try{await fs.writeFile(snapshot,lines.join('\n')+'\n',{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}
const decisions=['# Decision log','','Generated from the shared brief. Existing approvals remain valid.','','| Date | Stage | Status | Evidence |','| --- | --- | --- | --- |',...brief.approvals.map(a=>`| ${a.date} | ${a.stage} | ${a.status} | ${a.evidence.replaceAll('|','/')} |`)];
await fs.writeFile('brief/decision-log.md',decisions.join('\n')+'\n');
console.log(`Readable brief and decision log synchronized with version ${brief.version}.`);
