export function publicationPayload(id,draft,owner) {
 return {event_id:id,event_draft:draft,event_owner:owner};
}
export const eventPublicationPath='/rest/v1/rpc/publish_event_draft';
export function publishedEventPath(id) {
 return `/rest/v1/published_events?id=eq.${id}&select=content&limit=1`;
}
const usZones=new Set(['America/New_York','America/Detroit','America/Kentucky/Louisville','America/Kentucky/Monticello','America/Indiana/Indianapolis','America/Indiana/Vincennes','America/Indiana/Winamac','America/Indiana/Marengo','America/Indiana/Petersburg','America/Indiana/Vevay','America/Chicago','America/Indiana/Tell_City','America/Indiana/Knox','America/Menominee','America/North_Dakota/Center','America/North_Dakota/New_Salem','America/North_Dakota/Beulah','America/Denver','America/Boise','America/Phoenix','America/Los_Angeles','America/Anchorage','America/Juneau','America/Sitka','America/Metlakatla','America/Yakutat','America/Nome','America/Adak','Pacific/Honolulu']);
// Publication-only checks provide readable errors before the database transaction.
// Draft editing still accepts incomplete schedules.
export function eventPublicationErrors(draft) {
 if(!usZones.has(draft.timezone))return ['Choose a United States time zone.'];
 const s=draft.schedule,dates=[...s.dates];
 if(s.kind==='weekly'){
  const first=Date.parse(`${s.start}T12:00:00Z`),last=Date.parse(`${s.until}T12:00:00Z`);
  if(last-first>365*86400000)return ['Use a repeating range of at most 366 days.'];
  dates.length=0;
  for(let day=first;day<=last;day+=86400000){const d=new Date(day);if(s.weekdays.includes(d.getUTCDay()))dates.push(`${d.toISOString().slice(0,10)}T${s.time}`);}
 }
 const formatter=new Intl.DateTimeFormat('en-US',{timeZone:draft.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const localAt=ms=>{const p=Object.fromEntries(formatter.formatToParts(ms).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;};
 for(const local of dates){
  const nominal=Date.parse(`${local}Z`),offsets=new Set();
  for(const delta of [-86400000,0,86400000]){const sample=nominal+delta;offsets.add(Date.parse(`${localAt(sample)}Z`)-sample);}
  const matches=[...offsets].filter(offset=>localAt(nominal-offset)===local).length;
  if(!matches)return ['This local time does not exist because the clocks change. Choose another time.'];
  if(matches>1)return ['This local time occurs twice because the clocks change. Choose another time.'];
 }
 return [];
}
