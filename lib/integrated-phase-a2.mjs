import {createHash,randomUUID} from 'node:crypto';
import {parseListing} from './listing.mjs';
import {PAYMENT_PREFERENCES} from './setup.mjs';
import {PhaseA1Error,originMatches} from './integrated-phase-a1.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const TIME=/^([01]\d|2[0-3]):[0-5]\d$/;
const DT=/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
const keys=(x,allowed)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>allowed.includes(k));
const fail=(code,message,status=400,fields)=>{throw new PhaseA1Error(code,message,status,fields);};
const field=(path,code='INVALID_FIELD')=>fail('INVALID_INPUT','Check the event details.',400,[{path,code,message:'Check this field.'}]);
const str=(v,n,path)=>{if(typeof v!=='string'||v.length>n)field(path);return v;};
const bool=(v,path)=>{if(typeof v!=='boolean')field(path);return v;};
const int=(v,min,max,path,nullable=false)=>{if(v===null&&nullable)return null;if(!Number.isInteger(v)||v<min||v>max)field(path);return v;};
const date=(v,path)=>{if(v===null)return null;if(typeof v!=='string'||!DATE.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)field(path);return v;};
const time=(v,path)=>{if(v===null)return null;if(typeof v!=='string'||!TIME.test(v))field(path);return v;};
const id=(v,path)=>{if(typeof v!=='string'||!UUID.test(v))field(path);return v.toLowerCase();};
const coord=(v,max,path)=>{if(v===null)return null;if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>max||Math.round(v*1e6)!==v*1e6)field(path);return v;};
const place=(v,path)=>{if(!keys(v,['name','address','latitude','longitude','photoAssetId'])||Object.keys(v).length!==5)field(path);const latitude=coord(v.latitude,90,`${path}.latitude`),longitude=coord(v.longitude,180,`${path}.longitude`);if((latitude===null)!==(longitude===null))field(path);return {name:str(v.name,100,`${path}.name`),address:str(v.address,200,`${path}.address`),latitude,longitude,photoAssetId:v.photoAssetId===null?null:id(v.photoAssetId,`${path}.photoAssetId`)};};
const unique=(arr,path)=>{if(new Set(arr).size!==arr.length)field(path);return arr;};
export function parseEventDraft(v){
 const required=['title','description','type','timezone','businessLocation','sameLocation','eventLocation','coverAssetId','schedule','inventory','tiers','seating','ticketFormat','restrictions','disclaimer','disclaimerReviewed','refundPolicy','supportiveMessage','referrals','paymentPreferences'];
 if(!keys(v,required)||Object.keys(v).length!==required.length)field('draft');
 const title=str(v.title,200,'title'),description=str(v.description,4000,'description');if(!['event','activity'].includes(v.type))field('type');
 const timezone=str(v.timezone,100,'timezone');try{new Intl.DateTimeFormat('en-US',{timeZone:timezone});}catch{field('timezone');}
 const businessLocation=place(v.businessLocation,'businessLocation'),sameLocation=bool(v.sameLocation,'sameLocation');
 const eventLocation=sameLocation?(v.eventLocation===null?null:field('eventLocation')):place(v.eventLocation,'eventLocation');
 const coverAssetId=v.coverAssetId===null?null:id(v.coverAssetId,'coverAssetId');
 const s=v.schedule;if(!keys(s,['kind','dates','startDate','endDate','weekdays','localTime','durationMinutes'])||Object.keys(s).length!==7||!['dates','weekly'].includes(s.kind))field('schedule');
 if(!Array.isArray(s.dates)||s.dates.length>50||s.dates.some(x=>typeof x!=='string'||!DT.test(x)||date(x.slice(0,10),'schedule.dates')!==x.slice(0,10)))field('schedule.dates');unique(s.dates,'schedule.dates');
 if(!Array.isArray(s.weekdays)||s.weekdays.some(x=>!Number.isInteger(x)||x<0||x>6))field('schedule.weekdays');unique(s.weekdays,'schedule.weekdays');
 const startDate=date(s.startDate,'schedule.startDate'),endDate=date(s.endDate,'schedule.endDate'),localTime=time(s.localTime,'schedule.localTime');
 if(s.kind==='dates'&&(startDate!==null||endDate!==null||localTime!==null||s.weekdays.length)||s.kind==='weekly'&&s.dates.length)field('schedule');
 if(startDate&&endDate&&(endDate<startDate||(Date.parse(endDate)-Date.parse(startDate))/86400000>366))field('schedule.endDate');
 const schedule={kind:s.kind,dates:s.dates,startDate,endDate,weekdays:s.weekdays,localTime,durationMinutes:int(s.durationMinutes,5,1440,'schedule.durationMinutes')};
 const i=v.inventory;if(!keys(i,['dateScope','tierScope','totalCapacity'])||Object.keys(i).length!==3||![null,'per_occurrence','across_dates'].includes(i.dateScope)||!['shared','allocated'].includes(i.tierScope))field('inventory');
 const inventory={dateScope:i.dateScope,tierScope:i.tierScope,totalCapacity:int(i.totalCapacity,1,1000000,'inventory.totalCapacity',true)};
 if(!Array.isArray(v.tiers)||v.tiers.length>10)field('tiers');const tiers=v.tiers.map((t,n)=>{const path=`tiers.${n}`;if(!keys(t,['id','name','description','priceMinor','currency','allocation','seatPolicy'])||!['USD'].includes(t.currency)||!['none','optional','required'].includes(t.seatPolicy))field(path);return {id:id(t.id,`${path}.id`),name:str(t.name,100,`${path}.name`),description:str(t.description,1000,`${path}.description`),priceMinor:int(t.priceMinor,0,10000000,`${path}.priceMinor`,true),currency:'USD',allocation:int(t.allocation,1,1000000,`${path}.allocation`,true),seatPolicy:t.seatPolicy};});unique(tiers.map(t=>t.id),'tiers');
 const seat=v.seating;if(!keys(seat,['enabled','sections'])||Object.keys(seat).length!==2||typeof seat.enabled!=='boolean'||!Array.isArray(seat.sections)||seat.sections.length>50)field('seating');let seatCount=0,sparseCount=0;
 const sections=seat.sections.map((x,n)=>{const path=`seating.sections.${n}`;if(!keys(x,['id','name','rows','seatsPerRow','seatTierId','accessibleSeats','removedSeats','seatOverrides','geometryReset']))field(path);
  const rows=int(x.rows,1,100,`${path}.rows`),seatsPerRow=int(x.seatsPerRow,1,100,`${path}.seatsPerRow`);
  const coordinates=(value,key,override=false)=>{const list=value??[];if(!Array.isArray(list)||list.length>rows*seatsPerRow)field(`${path}.${key}`);const parsed=list.map((a,j)=>{const at=`${path}.${key}.${j}`;if(!keys(a,override?['row','number','seatTierId']:['row','number'])||Object.keys(a).length!==(override?3:2))field(at);const result={row:int(a.row,1,rows,`${at}.row`),number:int(a.number,1,seatsPerRow,`${at}.number`)};if(override){result.seatTierId=a.seatTierId===null?null:id(a.seatTierId,`${at}.seatTierId`);if(result.seatTierId&&!tiers.some(t=>t.id===result.seatTierId&&t.seatPolicy!=='none'))field(`${at}.seatTierId`);}return result;});unique(parsed.map(a=>`${a.row}:${a.number}`),`${path}.${key}`);return parsed.sort((a,b)=>a.row-b.row||a.number-b.number);};
  const accessibleSeats=coordinates(x.accessibleSeats,'accessibleSeats'),removedSeats=coordinates(x.removedSeats,'removedSeats'),seatOverrides=coordinates(x.seatOverrides,'seatOverrides',true),removed=new Set(removedSeats.map(a=>`${a.row}:${a.number}`));
  if(accessibleSeats.some(a=>removed.has(`${a.row}:${a.number}`))||seatOverrides.some(a=>removed.has(`${a.row}:${a.number}`)))field(path);
  const seatTierId=x.seatTierId===null?null:id(x.seatTierId,`${path}.seatTierId`);if(seatTierId&&!tiers.some(t=>t.id===seatTierId&&t.seatPolicy!=='none'))field(`${path}.seatTierId`);
  const geometryReset=x.geometryReset===undefined?false:bool(x.geometryReset,`${path}.geometryReset`);
  seatCount+=rows*seatsPerRow-removedSeats.length;sparseCount+=accessibleSeats.length+removedSeats.length+seatOverrides.length;
  return {id:id(x.id,`${path}.id`),name:str(x.name,100,`${path}.name`),rows,seatsPerRow,seatTierId,accessibleSeats,removedSeats,seatOverrides,geometryReset};
 });if(seatCount>10000||sparseCount>10000||(!seat.enabled&&sections.length))field('seating.sections');unique(sections.map(x=>x.id),'seating.sections');
 if(!['','digital','paper','both'].includes(v.ticketFormat))field('ticketFormat');
 const r=v.referrals;if(!keys(r,['enabled','percentageBasisPoints'])||Object.keys(r).length!==2)field('referrals');
 if(!Array.isArray(v.paymentPreferences)||v.paymentPreferences.some(x=>!PAYMENT_PREFERENCES.includes(x)))field('paymentPreferences');unique(v.paymentPreferences,'paymentPreferences');
 return {title,description,type:v.type,timezone,businessLocation,sameLocation,eventLocation,coverAssetId,schedule,inventory,tiers,seating:{enabled:seat.enabled,sections},ticketFormat:v.ticketFormat,restrictions:str(v.restrictions,4000,'restrictions'),disclaimer:str(v.disclaimer,4000,'disclaimer'),disclaimerReviewed:bool(v.disclaimerReviewed,'disclaimerReviewed'),refundPolicy:str(v.refundPolicy,4000,'refundPolicy'),supportiveMessage:bool(v.supportiveMessage,'supportiveMessage'),referrals:{enabled:bool(r.enabled,'referrals.enabled'),percentageBasisPoints:int(r.percentageBasisPoints,0,9000,'referrals.percentageBasisPoints',true)},paymentPreferences:v.paymentPreferences};
}
const money=v=>v===''?null:Math.round(Number(v)*100);
const quantity=v=>v===''?null:Number(v);
const legacyPlace=(p,address)=>({name:'',address,latitude:p.lat!==''&&p.lng!==''?Number(p.lat):null,longitude:p.lat!==''&&p.lng!==''?Number(p.lng):null,photoAssetId:null});
export function importLegacyDraft(input){
 let d;try{d=parseListing(input);}catch{fail('INVALID_INPUT','Check the creator draft.',400);}
 const warnings=[];const warn=(path,code,message,localMediaSlot)=>warnings.push({path,code,message,...(localMediaSlot?{localMediaSlot}:{})});
 const mappedRoot=new Set(['title','type','description','location','timezone','price','capacity','duration','ticketFormat','ticketTiers','setup','schedule','coverImage']);
 const mappedSetup=new Set(['business','sameLocation','eventLocation','inventoryMode','restrictions','disclaimer','refundPolicy','disclaimerReviewed','supportiveMessage','referrals','paymentPreferences']);
 for(const key of Object.keys(input))if(!mappedRoot.has(key))warn(key,'UNMAPPED_FIELD','This conversation detail needs review.');
 if(input.setup&&typeof input.setup==='object')for(const key of Object.keys(input.setup))if(!mappedSetup.has(key))warn(`setup.${key}`,'UNMAPPED_FIELD','This setup detail needs review.');
 const business=legacyPlace(d.setup.business,d.setup.business.address||(d.setup.sameLocation?d.location:''));
 const event=d.setup.sameLocation?null:legacyPlace(d.setup.eventLocation,d.setup.eventLocation.address||d.location);
 if(!business.address)warn('businessLocation.address','LOCATION_NEEDED','Add the business address.');
 for(const [slot,placeValue,source] of [['business',business,d.setup.business],['event-location',event,d.setup.eventLocation]])if(placeValue){if(!placeValue.address)warn(slot==='business'?'businessLocation.address':'eventLocation.address','LOCATION_NEEDED','Add the location address.');if(placeValue.latitude===null)warn(slot==='business'?'businessLocation.latitude':'eventLocation.latitude','PIN_NEEDED','Place the location pin.');if(source.photo)warn(slot==='business'?'businessLocation.photoAssetId':'eventLocation.photoAssetId','LOCAL_IMAGE_UPLOAD_NEEDED','Upload this saved device photo. ',slot);}
 if(d.coverImage)warn('coverAssetId','LOCAL_IMAGE_UPLOAD_NEEDED','Upload this saved device image.','cover');
 const allocated=d.setup.inventoryMode==='allocated',tiers=d.ticketTiers.length?d.ticketTiers.map(t=>({id:t.id,name:t.name,description:t.description,priceMinor:money(t.price),currency:'USD',allocation:allocated?quantity(t.quantity):null,seatPolicy:'none'})):[{id:randomUUID(),name:'General admission',description:'',priceMinor:money(d.price),currency:'USD',allocation:null,seatPolicy:'none'}];
 const totalCapacity=allocated&&d.ticketTiers.length?(tiers.every(t=>t.allocation!==null)?tiers.reduce((a,t)=>a+t.allocation,0):null):quantity(d.capacity);
 warn('inventory.dateScope','INVENTORY_DATE_SCOPE_NEEDED','Choose how dates share ticket quantity.');
 const schedule=d.schedule.kind==='dates'?{kind:'dates',dates:d.schedule.dates,startDate:null,endDate:null,weekdays:[],localTime:null,durationMinutes:d.duration}:{kind:'weekly',dates:[],startDate:d.schedule.start||null,endDate:d.schedule.until||null,weekdays:d.schedule.weekdays,localTime:d.schedule.time||null,durationMinutes:d.duration};
 const draft=parseEventDraft({title:d.title,description:d.description,type:d.type,timezone:d.timezone,businessLocation:business,sameLocation:d.setup.sameLocation,eventLocation:event,coverAssetId:null,schedule,inventory:{dateScope:null,tierScope:d.setup.inventoryMode,totalCapacity},tiers,seating:{enabled:false,sections:[]},ticketFormat:d.ticketFormat,restrictions:d.setup.restrictions,disclaimer:d.setup.disclaimer,disclaimerReviewed:d.setup.disclaimerReviewed,refundPolicy:d.setup.refundPolicy,supportiveMessage:d.setup.supportiveMessage,referrals:{enabled:d.setup.referrals.enabled,percentageBasisPoints:d.setup.referrals.percentage===''?null:Math.round(Number(d.setup.referrals.percentage)*100)},paymentPreferences:d.setup.paymentPreferences});
 return {draft,warnings};
}
export function draftWarnings(d){const w=[];const add=(path,code,message)=>w.push({path,code,message});for(const [name,p] of [['businessLocation',d.businessLocation],['eventLocation',d.eventLocation]])if(p){if(!p.address)add(`${name}.address`,'LOCATION_NEEDED','Add the location address.');if(p.latitude===null)add(`${name}.latitude`,'PIN_NEEDED','Place the location pin.');if(!p.photoAssetId)add(`${name}.photoAssetId`,'PHOTO_NEEDED','Add a location photo.');}if(d.inventory.dateScope===null)add('inventory.dateScope','INVENTORY_DATE_SCOPE_NEEDED','Choose how dates share ticket quantity.');return w;}
export function parsePatch(previous,changes){if(!keys(changes,Object.keys(previous)))field('changes');const merged={...previous,...changes};for(const name of ['businessLocation','eventLocation'])if(changes[name]&&previous[name]&&changes[name].address!==previous[name].address){if(changes[name].latitude!==null||changes[name].longitude!==null)fail('PIN_RECONFIRM_REQUIRED','Save the address, then place its pin.',422,[{path:name,code:'PIN_RECONFIRM_REQUIRED',message:'Place the pin after saving the new address.'}]);merged[name]={...changes[name],latitude:null,longitude:null};}return parseEventDraft(merged);}
export async function readA2Body(request,maxBytes){if(!originMatches(request))fail('WRONG_ORIGIN','Please use the clickatick website.',403);if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')fail('INVALID_INPUT','Send JSON details.');const reader=request.body?.getReader();if(!reader)fail('INVALID_INPUT','Add event details.');let bytes=0;const parts=[];try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>maxBytes){await reader.cancel();fail('BODY_TOO_LARGE','Event details are too large.',413);}parts.push(Buffer.from(value));}}finally{reader.releaseLock();}try{return JSON.parse(Buffer.concat(parts,bytes).toString('utf8'));}catch{fail('INVALID_INPUT','Check the event details.');}}
export const requestDigest=input=>createHash('sha256').update(JSON.stringify(input)).digest('hex');
export const validId=(value,path)=>id(value,path);
