export const PAYMENT_PREFERENCES=['card','bank-transfer','digital-wallet','bitcoin','crypto','epay'];
const place=()=>({address:'',lat:'',lng:'',photo:null});
export function emptySetup(){return {business:place(),sameLocation:true,eventLocation:place(),inventoryMode:'allocated',restrictions:'',disclaimer:'',refundPolicy:'',disclaimerReviewed:false,supportiveMessage:false,referrals:{enabled:false,percentage:''},paymentPreferences:[]};}
function text(value,limit,label){if(typeof value!=='string'||value.length>limit)throw new Error(`Check ${label}.`);return value.trim();}
function coordinate(value,limit){const clean=text(value,24,'the map coordinates');if(clean!==''&&(!/^-?\d+(\.\d+)?$/.test(clean)||Math.abs(Number(clean))>limit))throw new Error('Enter valid map coordinates.');return clean;}
function parsePlace(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Check the location details.');
 const result={address:text(value.address,200,'the address'),lat:coordinate(value.lat,90),lng:coordinate(value.lng,180),photo:null};
 if(value.photo!=null){
  const p=value.photo;
  if(!p||typeof p!=='object'||!['image/jpeg','image/png','image/webp'].includes(p.mime)||typeof p.dataUrl!=='string'||p.dataUrl.length>600000||!p.dataUrl.startsWith(`data:${p.mime};base64,`)||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(p.dataUrl))throw new Error('Use a smaller JPEG, PNG or WebP venue photo.');
  result.photo={name:text(p.name,200,'the photo name'),mime:p.mime,dataUrl:p.dataUrl};
 }
 return result;
}
export function parseSetup(value){
 if(value===undefined)return emptySetup();
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Check the setup details.');
 const result=emptySetup();
 for(const key of ['business','eventLocation'])result[key]=parsePlace(value[key]);
 for(const key of ['sameLocation','disclaimerReviewed','supportiveMessage']){if(typeof value[key]!=='boolean')throw new Error('Check the setup choices.');result[key]=value[key];}
 if(!['allocated','shared'].includes(value.inventoryMode))throw new Error('Choose shared or allocated ticket quantities.');
 result.inventoryMode=value.inventoryMode;
 for(const key of ['restrictions','disclaimer'])result[key]=text(value[key],4000,`the ${key}`);
 result.refundPolicy=text(value.refundPolicy??'',4000,'the refund policy');
 const referral=value.referrals;
 if(!referral||typeof referral.enabled!=='boolean')throw new Error('Check the referral choice.');
 const percentage=text(referral.percentage,6,'the referral percentage');
 if(percentage!==''&&(!/^\d+(\.\d{1,2})?$/.test(percentage)||Number(percentage)>90))throw new Error('Referral rewards must be between 0% and 90% of the ticket price.');
 result.referrals={enabled:referral.enabled,percentage};
 if(!Array.isArray(value.paymentPreferences)||value.paymentPreferences.some(x=>!PAYMENT_PREFERENCES.includes(x)))throw new Error('Choose valid payment preferences.');
 result.paymentPreferences=[...new Set(value.paymentPreferences)];
 return result;
}
export function effectiveLocation(setup){return setup.sameLocation?setup.business:setup.eventLocation;}
export function toAIListing(draft){
 const setup=parseSetup(draft.setup);
 return {...draft,setup:{...setup,business:{...setup.business,photo:null},eventLocation:{...setup.eventLocation,photo:null}}};
}
export function mergeAIDraft(previous,response){
 const before=parseSetup(previous.setup),patch=response.setupPatch;
 const setup={...before,business:{...before.business},eventLocation:{...before.eventLocation},referrals:{...before.referrals},paymentPreferences:[...before.paymentPreferences]};
 // Only explicit, nullable patch fields may alter organiser settings. Media and pins never come from the model.
 if(patch&&typeof patch==='object'&&!Array.isArray(patch)){
  for(const [field,key] of [['businessAddress','business'],['eventAddress','eventLocation']])if(patch[field]!=null&&patch[field]!==setup[key].address)setup[key]={...setup[key],address:patch[field],lat:'',lng:''};
  for(const key of ['sameLocation','restrictions','disclaimer','refundPolicy','supportiveMessage','inventoryMode'])if(patch[key]!=null)setup[key]=patch[key];
  if(patch.referralEnabled!=null)setup.referrals.enabled=patch.referralEnabled;
  if(patch.referralPercentage!=null)setup.referrals.percentage=patch.referralPercentage;
  if(patch.paymentPreferences!=null)setup.paymentPreferences=patch.paymentPreferences;
 }
 // Client receives a server-validated setup. Keep only browser-owned photo/pin data where its address still matches.
 else if(response.setup){
  const received=parseSetup(response.setup);
  Object.assign(setup,received);
  for(const key of ['business','eventLocation'])setup[key]={...received[key],photo:before[key].photo,...(received[key].address===before[key].address?{lat:before[key].lat,lng:before[key].lng}:{lat:'',lng:''})};
 }
 setup.disclaimerReviewed=setup.disclaimer===before.disclaimer?before.disclaimerReviewed:false;
 const {setupPatch:unused,...listing}=response;
 const valid=parseSetup(setup),address=effectiveLocation(valid).address;
 return {...listing,...(address?{location:address}:{}),setup:valid};
}
export function mapLinks(location){
 try{const lat=coordinate(location.lat,90),lng=coordinate(location.lng,180);if(!lat||!lng)return null;const point=`${lat},${lng}`;return {google:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point)}`,bing:`https://www.bing.com/maps?cp=${lat}~${lng}&lvl=17&sp=point.${lat}_${lng}_Event`};}catch{return null;}
}
export function referralSplit(price,percentage){
 if(!/^\d+(\.\d{1,2})?$/.test(price)||Number(price)>100000||!/^\d+(\.\d{1,2})?$/.test(percentage)||Number(percentage)>90)return null;
 const cents=Math.round(Number(price)*100),platform=Math.round(cents*.1),referral=Math.min(cents-platform,Math.round(cents*Number(percentage)/100));
 return {platform:platform/100,referral:referral/100,business:(cents-platform-referral)/100};
}
export function hasSetupDetails(setup){return JSON.stringify(parseSetup(setup))!==JSON.stringify(emptySetup());}
