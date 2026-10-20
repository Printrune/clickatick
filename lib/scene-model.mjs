// Visual facts come only from the accepted listing. This model never adds listing data.
const CUES = {
  halloween: /\b(halloween|ghosts?|haunted|spooky)\b/i,
  tour: /\b(tours?|walking|guided|sightseeing)\b/i,
  music: /\b(music|concerts?|bands?|dj|jazz|orchestra|singing)\b/i,
  workshop: /\b(workshops?|crafts?|painting|pottery|ceramics?|drawing)\b/i,
  food: /\b(food|cooking|tasting|dinner|lunch|baking)\b/i,
  movement: /\b(yoga|dance|dancing|fitness|pilates|running)\b/i,
  nature: /\b(nature|forest|woodland|garden|park|hiking)\b/i,
};

function affirmed(text, expression) {
  const matches = text.matchAll(new RegExp(expression.source, 'gi'));
  return [...matches].some(match => !/\b(?:no|not|without|excluding)\s+(?:\w+\s+){0,2}$/i.test(text.slice(Math.max(0, match.index - 32), match.index)));
}

export function sceneTheme(draft = {}) {
  const text = `${draft.title || ''} ${draft.description || ''}`;
  return Object.entries(CUES).find(([, pattern]) => affirmed(text, pattern))?.[0] || 'idea';
}

// Fixed seats keep every existing guest in place as capacity changes. The first
// guests occupy the front arc; later guests fill behind them. Paint order is depth.
export const CROWD_PLACES = [
  {x:350,y:360,scale:.84}, {x:414,y:367,scale:.86}, {x:478,y:359,scale:.83},
  {x:538,y:344,scale:.79}, {x:291,y:345,scale:.79},
  {x:326,y:319,scale:.74}, {x:390,y:324,scale:.75}, {x:454,y:320,scale:.74},
  {x:513,y:308,scale:.71}, {x:566,y:303,scale:.68},
  {x:298,y:286,scale:.66}, {x:357,y:286,scale:.66}, {x:416,y:286,scale:.66},
  {x:475,y:282,scale:.65}, {x:533,y:288,scale:.64},
  {x:258,y:311,scale:.72}, {x:267,y:377,scale:.86}, {x:328,y:398,scale:.89},
  {x:399,y:402,scale:.9}, {x:470,y:392,scale:.87},
];

export function ticketForGuest(format, index) {
  if (format === 'both') return index % 2 ? 'digital' : 'paper';
  return format === 'digital' || format === 'paper' ? format : '';
}

function timeLabel(time) {
  if (!/^\d{2}:\d{2}$/.test(time || '')) return '';
  const [hour, minute] = time.split(':').map(Number);
  if (hour > 23 || minute > 59) return '';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
}

const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function dateLabel(value) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value || '')) return '';
  const date = new Date(`${value.slice(0,10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
}

export function avatarStyle(appearance) {
  const color = (value, fallback) => /^#[\da-f]{6}$/i.test(value || '') ? value : fallback;
  const ratio = value => Number.isFinite(value) ? Math.min(1.15,Math.max(.85,value)) : 1;
  return {
    skinColor:color(appearance?.skinColor,'#f3d3bb'),
    hairColor:color(appearance?.hairColor,'#302a42'),
    hairStyle:['short','long','cropped'].includes(appearance?.hairStyle)?appearance.hairStyle:'short',
    faceWidth:ratio(appearance?.faceWidth),faceHeight:ratio(appearance?.faceHeight),
  };
}

// A successful answer always leaves a small, readable record in the picture.
// Revision identity, rather than answer text, preserves repeated corrections.
export function appendSceneAnswer(entries, revision, answerNote, facts = []) {
  const text = String(answerNote || '').replace(/\s+/g,' ').trim().slice(0,120);
  if (!Number.isSafeInteger(revision) || revision < 1 || !text || entries.some(entry=>entry.revision===revision)) return entries;
  return [...entries,{revision,text,kind:facts.find(key=>['location','date','schedule','time','duration','price','tickets','capacity','format','title'].includes(key)) || 'idea'}].slice(-3);
}

export function sceneModel(draft = {}) {
  const text = `${draft.title || ''} ${draft.description || ''}`;
  const cues = Object.entries(CUES).filter(([,pattern]) => affirmed(text, pattern)).map(([cue]) => cue);
  const capacity = Number.isSafeInteger(Number(draft.capacity)) && Number(draft.capacity) > 0 ? Number(draft.capacity) : 0;
  const count = Math.min(capacity, CROWD_PLACES.length);
  const format = ['paper','digital','both'].includes(draft.ticketFormat) ? draft.ticketFormat : '';
  const firstDate = (draft.schedule?.dates || []).find(date => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date));
  const startTime = draft.schedule?.kind === 'weekly' ? draft.schedule.time : firstDate?.slice(11,16) || draft.schedule?.time;
  const time = timeLabel(startTime);
  const hour = time ? Number(startTime.slice(0, 2)) : null;
  const light = hour === null ? 'neutral' : hour < 6 || hour >= 20 ? 'night' : hour >= 17 ? 'evening' : 'day';
  const outdoors = affirmed(text, /\b(outdoors?|open air|park|garden|forest|woodland)\b/i);
  const indoors = affirmed(text, /\b(indoors?|studio|theatre|theater|gallery)\b/i);
  const location = String(draft.location || '').trim();
  // The listing has a 60-minute form default without a separate confirmation flag.
  // Keep that default out of the illustration unless the description confirms it.
  const durationConfirmed = Number(draft.duration) !== 60 || /\b(60\s*(?:min|minute)|one[ -]hour|1[ -]hour)\b/i.test(text);
  const duration = Number(draft.duration) > 0 && durationConfirmed ? `${Number(draft.duration)} min` : '';
  const ticketNames = (draft.ticketTiers || []).map(tier => String(tier.name || '').trim()).filter(Boolean);
  const ticketDesigns = (draft.ticketTiers || []).filter(tier=>String(tier.name || '').trim()).map(tier=>({name:String(tier.name).trim(),price:/^\d+(\.\d{1,2})?$/.test(String(tier.price ?? ''))?Number(tier.price)===0?'Free':`$${Number(tier.price).toLocaleString('en-US',{maximumFractionDigits:2})}`:''}));
  const price = /^\d+(\.\d{1,2})?$/.test(String(draft.price ?? '')) ? Number(draft.price) === 0 ? ticketDesigns.length>1?'Free tickets available':'Free tickets' : `${ticketDesigns.length>1?'From ':''}$${Number(draft.price).toLocaleString('en-US',{maximumFractionDigits:2})} per ticket` : '';
  const date = dateLabel(firstDate || draft.schedule?.start);
  const days = (draft.schedule?.weekdays || []).filter(day=>Number.isInteger(day)&&day>=0&&day<=6).map(day=>SHORT_DAYS[day]);
  const schedule = draft.schedule?.kind==='weekly' && days.length ? `Every ${days.join(', ')}` : (draft.schedule?.dates || []).length > 1 ? `${draft.schedule.dates.length} dates` : '';
  return {
    theme: cues[0] || 'idea', cues, capacity, count, format, time, light, location, duration,date,schedule,price,
    clock:time?{hour:(Number(startTime.slice(0,2))%12)*30+Number(startTime.slice(3))*0.5,minute:Number(startTime.slice(3))*6}:null,
    outdoors: outdoors && !indoors, indoors: indoors && !outdoors,
    pottery: affirmed(text, /\b(pottery|ceramics?)\b/i),
    ghostStories: affirmed(text, /\b(ghosts?|ghost stories|haunted|spooky)\b/i),
    title: String(draft.title || '').trim(),
    known: Boolean(text.trim() || capacity || location || time),
    ticketNames,ticketDesigns,
    guests: CROWD_PLACES.slice(0,count).map((place,index) => ({...place,index,format:ticketForGuest(format,index)})),
    facts: {location, time, duration, capacity:capacity ? `${capacity.toLocaleString('en-US')} guest places` : '', format:format === 'digital' ? 'Phone tickets' : format === 'paper' ? 'Paper tickets' : format === 'both' ? 'Paper + phone tickets' : '', tickets:ticketDesigns.map(ticket=>[ticket.name,ticket.price].filter(Boolean).join(' ')).join(', '),price,title:String(draft.title || '').trim(),date,schedule},
  };
}

export function changedSceneFacts(before, after) {
  if (!before) return [];
  return Object.keys(after.facts).filter(key => after.facts[key] && after.facts[key] !== before.facts[key]);
}
