// Test fixture adapter only. Production accepts only the compact provider DTO.
const texts=['title','type','description','location','timezone','price','capacity','ticketFormat','businessAddress','eventAddress','restrictions','disclaimer','refundPolicy','referralPercentage','inventoryMode'];
const flags=['sameLocation','supportiveMessage','referralEnabled'];
export function providerDTO(answer={reply:'What would you like to add next?',patch:{},sources:[],pending:[]}){
 const source=answer.patch||{};
 const patch={text:texts.filter(field=>source[field]!=null).map(field=>({field,value:source[field]})),flags:flags.filter(field=>source[field]!=null).map(field=>({field,value:source[field]})),duration:source.duration??null,ticketTiers:source.ticketTiers?.map(tier=>Object.fromEntries(['id','name','description','price','quantity'].map(key=>[key,tier[key]??null])))??null,schedule:source.schedule?Object.fromEntries(['kind','dates','start','until','time','weekdays'].map(key=>[key,source.schedule[key]??null])):null,paymentPreferences:source.paymentPreferences??null,clearFields:source.clearFields??[],resolveFields:source.resolveFields??[]};
 return {reply:answer.reply,patch,sources:answer.sources,pending:answer.pending};
}
