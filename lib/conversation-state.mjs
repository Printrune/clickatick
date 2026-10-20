/** Bounded conversation evidence. This module is safe in browser and server. */
export const CONVERSATION_FIELDS=['title','type','description','location','timezone','price','capacity','duration','ticketFormat','ticketTiers','schedule','businessAddress','eventAddress','sameLocation','restrictions','disclaimer','refundPolicy','supportiveMessage','referralEnabled','referralPercentage','inventoryMode','paymentPreferences','details'];
export function parseConversationState(value){
 if(value===undefined)return {version:1,pendingFacts:[]};
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||!Array.isArray(value.pendingFacts)||value.pendingFacts.length>12)throw new Error('The saved conversation details are not valid. Your listing is safe.');
 const pendingFacts=value.pendingFacts.map(fact=>{
  if(!fact||typeof fact!=='object'||Array.isArray(fact)||!CONVERSATION_FIELDS.includes(fact.field)||typeof fact.sourceText!=='string'||!fact.sourceText.trim()||fact.sourceText.length>500)throw new Error('The saved conversation details are not valid. Your listing is safe.');
  return {field:fact.field,sourceText:fact.sourceText.trim()};
 });
 const result={version:1,pendingFacts};
 if(new TextEncoder().encode(JSON.stringify(result)).length>6000)throw new Error('There are too many unfinished conversation details. Your listing is safe.');
 return result;
}
