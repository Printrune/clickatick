import {emptySetup,parseSetup,hasSetupDetails,effectiveLocation} from './setup.mjs';
export function emptyListing() {
  return {title:'',type:'event',description:'',location:'',timezone:'America/New_York',price:'',capacity:'',duration:60,ticketFormat:'',ticketTiers:[],setup:emptySetup(),schedule:{kind:'dates',dates:[],start:'',until:'',time:'',weekdays:[]}};
}
export function tierSummary(tiers) {
  const prices=tiers.map(t=>t.price),quantities=tiers.map(t=>t.quantity);
  return {price:prices.length&&prices.every(p=>/^\d+(\.\d{1,2})?$/.test(p))?Math.min(...prices.map(Number)).toFixed(2):'',capacity:quantities.length&&quantities.every(q=>/^\d+$/.test(q)&&Number(q)>0)?String(quantities.reduce((sum,q)=>sum+Number(q),0)):''};
}
export function parseListing(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('A listing is required.');
  const result = emptyListing();
  if(value.coverImage!==undefined){
    const image=value.coverImage;
    if(!image||typeof image!=='object'||Array.isArray(image)||Object.keys(image).sort().join(',')!=='dataUrl,mime,origin'||image.mime!=='image/jpeg'||image.origin!=='scene'||typeof image.dataUrl!=='string'||image.dataUrl.length>450000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image.dataUrl))throw new Error('Check the event image.');
    const encoded=image.dataUrl.slice('data:image/jpeg;base64,'.length);
    let bytes;try{bytes=atob(encoded);}catch{throw new Error('Check the event image.');}
    if(!bytes.length||bytes.length>340000||btoa(bytes)!==encoded||bytes.charCodeAt(0)!==0xff||bytes.charCodeAt(1)!==0xd8||bytes.charCodeAt(2)!==0xff||bytes.charCodeAt(bytes.length-2)!==0xff||bytes.charCodeAt(bytes.length-1)!==0xd9)throw new Error('Check the event image.');
    result.coverImage={mime:'image/jpeg',dataUrl:image.dataUrl,origin:'scene'};
  }
  result.setup=parseSetup(value.setup);
  for (const key of ['title','description','location','timezone','price','capacity']) {
    if (typeof value[key] !== 'string' || value[key].length > (key === 'description' ? 4000 : 200)) throw new Error('Check the listing details.');
    result[key] = value[key].trim();
  }
  if(effectiveLocation(result.setup).address)result.location=effectiveLocation(result.setup).address;
  if (!['event','activity'].includes(value.type)) throw new Error('Choose an event or activity.');
  result.type = value.type;
  if (value.ticketFormat !== undefined) {
    if (!['','digital','paper','both'].includes(value.ticketFormat)) throw new Error('Choose a valid ticket delivery format.');
    result.ticketFormat = value.ticketFormat;
  }
  if (!Number.isInteger(value.duration) || value.duration < 5 || value.duration > 1440) throw new Error('Duration must be between 5 and 1440 minutes.');
  result.duration = value.duration;
  try { new Intl.DateTimeFormat('en-US',{timeZone:result.timezone}); } catch { throw new Error('Choose a valid time zone.'); }
  if (result.price && (!/^\d+(\.\d{1,2})?$/.test(result.price) || Number(result.price) > 100000)) throw new Error('Enter a valid ticket price.');
  if (result.capacity && (!/^\d+$/.test(result.capacity) || Number(result.capacity) < 1 || Number(result.capacity) > 1000000)) throw new Error('Enter a capacity of at least one.');
  if(value.ticketTiers!==undefined){
    if(!Array.isArray(value.ticketTiers)||value.ticketTiers.length>10)throw new Error('Use no more than ten ticket types.');
    const ids=new Set();
    result.ticketTiers=value.ticketTiers.map(t=>{
      if(!t||typeof t!=='object'||typeof t.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t.id)||ids.has(t.id))throw new Error('Each ticket type needs a unique identifier.');
      ids.add(t.id);
      for(const [key,limit] of [['name',100],['description',1000],['price',20],['quantity',20]])if(typeof t[key]!=='string'||t[key].length>limit)throw new Error('Check the ticket type details.');
      if(t.price&&(!/^\d+(\.\d{1,2})?$/.test(t.price)||Number(t.price)>100000))throw new Error('Check each ticket price.');
      if(t.quantity&&(!/^\d+$/.test(t.quantity)||Number(t.quantity)<1||Number(t.quantity)>1000000))throw new Error('Check each ticket quantity.');
      return {id:t.id,name:t.name.trim(),description:t.description.trim(),price:t.price,quantity:t.quantity};
    });
    if(result.ticketTiers.length){const summary=tierSummary(result.ticketTiers);result.price=summary.price;if(result.setup.inventoryMode==='allocated')result.capacity=summary.capacity;if(Number(result.capacity)>1000000)throw new Error('Total ticket quantity must not exceed one million.');}
  }
  result.schedule = parseSchedule(value.schedule);
  return result;
}
export function parseSchedule(s) {
  if (!s || !['dates','weekly'].includes(s.kind)) throw new Error('Choose a schedule.');
  const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)) && new Date(x).toISOString().slice(0,10) === x;
  const datetime = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(x) && date(x.slice(0,10));
  if (!Array.isArray(s.dates) || s.dates.length > 50 || !s.dates.every(x=>x===''||datetime(x))) throw new Error('Check the individual dates.');
  if (!Array.isArray(s.weekdays) || s.weekdays.some(x=>!Number.isInteger(x)||x<0||x>6)) throw new Error('Check the repeat days.');
  for (const key of ['start','until']) if (typeof s[key] !== 'string' || (s[key] && !date(s[key]))) throw new Error('Check the schedule dates.');
  if (typeof s.time !== 'string' || (s.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))) throw new Error('Check the start time.');
  return {kind:s.kind,dates:[...new Set(s.dates.filter(Boolean))].sort(),start:s.start,until:s.until,time:s.time,weekdays:[...new Set(s.weekdays)].sort()};
}
export function publicationErrors(listing) {
  return [...(hasSetupDetails(listing.setup)?['This extended setup is a device draft; legacy database publishing does not support these details.']:[]),...listingRequiredErrors(listing,{requireDescription:true})];
}
export function listingRequiredErrors(listing,{requireDescription=false}={}) {
  const errors = [];
  for (const key of ['title',...(requireDescription?['description']:[]),'location','price','capacity']) if (!listing[key]) errors.push(`Add the ${key}.`);
  for(const tier of listing.ticketTiers||[])if(!tier.name||tier.price===''||(listing.setup?.inventoryMode!=='shared'&&!tier.quantity))errors.push('Complete each ticket type name, price, and quantity.');
  if (listing.schedule.kind === 'dates' && !listing.schedule.dates.length) errors.push('Add at least one date and start time.');
  if (listing.type === 'event' && listing.schedule.kind === 'weekly') errors.push('Use individual dates for an event.');
  if (listing.schedule.kind === 'weekly') {
    const s = listing.schedule;
    if (!s.start || !s.until || !s.time || !s.weekdays.length) errors.push('Complete the repeating schedule.');
    else if (s.until < s.start) errors.push('The last date must follow the first date.');
    else {
      const first = new Date(`${s.start}T12:00:00Z`), last = new Date(`${s.until}T12:00:00Z`);
      let occurs = false;
      for (let i=0;i<7 && first<=last;i++,first.setUTCDate(first.getUTCDate()+1)) if(s.weekdays.includes(first.getUTCDay())) occurs=true;
      if (!occurs) errors.push('Choose a repeat day within the date range.');
    }
  }
  return errors;
}
export function scheduleLabel(listing) {
  const s=listing.schedule;
  if (s.kind==='weekly') return s.weekdays.length ? `Every ${s.weekdays.map(n=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][n]).join(', ')} at ${s.time || 'a time to confirm'}${s.start&&s.until?`, ${s.start} to ${s.until}`:''}` : 'Repeat days to confirm';
  return s.dates.length ? s.dates.map(x=>x.replace('T',' at ')).join(' · ') : 'Date and time to confirm';
}
