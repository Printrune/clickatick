export const ready=x=>x?.status==='approved';
export const canIndex=p=>!p.isDemo&&p.publicationApproved===true&&/^https:\/\//.test(p.siteUrl||'');
export function validateBrief(p){
 if(!p||typeof p!=='object'||Array.isArray(p))return ['A project object is required'];
 const errors=[],text=(x,n)=>{if(typeof x!=='string'||!x.trim())errors.push(`${n} must be supplied`);};
 if(p.schemaVersion!==1)errors.push('schemaVersion must be 1');
 if(!Number.isInteger(p.version)||p.version<1)errors.push('version must be a positive integer');
 if(typeof p.isDemo!=='boolean'||typeof p.publicationApproved!=='boolean')errors.push('Demo and publication flags must be booleans');
 if(!['b2b','b2c','mixed','unsure'].includes(p.business?.audienceType))errors.push('Choose b2b, b2c, mixed or unsure');
 for(const k of ['name','description','customer','offer'])text(p.business?.[k],`business.${k}`);
 if(!['waitlist','assessment','report','case-study','quote','booking','purchase','signup','listing'].includes(p.product?.journey))errors.push('Choose a supported visitor journey');
 for(const k of ['label','href'])text(p.product?.primaryAction?.[k],`product.primaryAction.${k}`);
 const href=p.product?.primaryAction?.href||'';if(!/^\/(?!\/)/.test(href)&&!/^https:\/\//.test(href))errors.push('Primary action must use a local path or HTTPS');
 for(const k of ['accent','ink','paper'])if(!/^#[0-9a-f]{6}$/i.test(p.brand?.[k]||''))errors.push(`brand.${k} needs a six-digit hex color`);
 for(const k of ['headline','summary'])text(p.positioning?.[k],`positioning.${k}`);
 if(!p.isDemo){if(!ready(p.positioning)||!ready(p.product))errors.push('Confirm positioning and product scope before configuring a real site');if(p.business?.audienceType==='unsure')errors.push('Confirm the buying context');if(!p.positioning?.sources?.length)errors.push('Approved positioning needs dated evidence sources');}
 for(const s of p.positioning?.sources||[])if(!s.id||!s.title||!s.date||!/^https:\/\//.test(s.url||''))errors.push('Each source needs id, title, date and HTTPS URL');
 if(ready(p.about)){text(p.about.headline,'about.headline');if(!Array.isArray(p.about.body)||!p.about.body.length)errors.push('Approved About needs verified body copy');for(const b of p.about.body||[])text(b,'about.body');for(const f of p.about.facts||[]){text(f.heading,'about fact heading');text(f.body,'about fact body');}}
 const ids=new Set((p.positioning?.sources||[]).map(x=>x.id));
 for(const c of ['articles','solutions']){if(!Array.isArray(p[c])){errors.push(`${c} must be an array`);continue;}const slugs=new Set();for(const x of p[c]){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug||'')||slugs.has(x.slug))errors.push(`${c}: invalid or duplicate slug`);slugs.add(x.slug);if(!ready(x))continue;for(const k of ['title','description'])text(x[k],`${x.slug}.${k}`);if(!Array.isArray(x.sections)||x.sections.length<2)errors.push(`${x.slug}: add two useful sections`);for(const s of x.sections||[]){text(s.heading,'section heading');text(s.body,'section body');}if(!x.sourceIds?.length||x.sourceIds.some(id=>!ids.has(id)))errors.push(`${x.slug}: cite real source IDs`);if(c==='articles'&&(!x.author||!/^\d{4}-\d{2}-\d{2}$/.test(x.updatedAt||'')))errors.push(`${x.slug}: actual author and review date needed`);if(c==='solutions'&&!x.uniqueValue?.trim())errors.push(`${x.slug}: distinct value needed`);}}
 if(p.business?.pricing?.display&&!p.business.pricing.approved)errors.push('Visible pricing must be approved');
 if(p.publicationApproved&&(!/^https:\/\//.test(p.siteUrl||'')||p.isDemo))errors.push('Publication needs a real HTTPS domain and non-demo brief');
 return errors;
}
export function marketingContext(p){return `# Product marketing context\n\nVersion: ${p.version}\nBusiness: ${p.business.name}\nBuying context: ${p.business.audienceType}\nCustomer: ${p.business.customer}\nOffer: ${p.business.offer}\nPricing model: ${p.business.pricing.model}\nPromise: ${p.positioning.headline}\nPositioning: ${p.positioning.summary}\nDifference: ${p.positioning.difference||'Not confirmed'}\nJourney: ${p.product.journey}\nAction: ${p.product.primaryAction.label}\nScope: ${(p.product.acceptance||[]).join('; ')}\n\n## Sources\n${p.positioning.sources.map(s=>`- ${s.id}: ${s.title} (${s.date}) ${s.url}`).join('\n')}\n\n## Open questions\n${p.intake.openQuestions.map(x=>`- ${x}`).join('\n')||'None recorded'}\n`;}
