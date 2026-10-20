import {parseListing} from './listing.mjs';
import {mergeAIDraft} from './setup.mjs';
import {sceneModel,changedSceneFacts} from './scene-model.mjs';

/** Feedback comes from accepted values, never the raw mixed or unresolved answer. */
export function acceptedDraftUpdate(previous,response){
 const before=parseListing(previous),draft=parseListing(mergeAIDraft(before,response));
 const changed=JSON.stringify(before)!==JSON.stringify(draft);
 if(!changed)return {draft,changed:false,note:''};
 const model=sceneModel(draft),keys=changedSceneFacts(sceneModel(before),model);
 const note=keys.slice(0,2).map(key=>model.facts[key]).filter(Boolean).join(' · ').slice(0,120)||'Ticket details updated';
 return {draft,changed:true,note};
}

export function savedSceneProgress(value){
 return value&&Number.isSafeInteger(value.revision)&&value.revision>=0&&typeof value.note==='string'&&value.note.length<=120?{revision:value.revision,note:value.note}:{revision:0,note:''};
}

export function clearPendingFields(state,fields){
 return {...state,pendingFacts:state.pendingFacts.filter(fact=>!fields.includes(fact.field))};
}

/** An explicit setup edit settles its pending topic, while other questions remain. */
export function changedSetupPendingFields(before,after){
 const fields=[];
 if(after.business.address!==before.business.address||after.eventLocation.address!==before.eventLocation.address||after.sameLocation!==before.sameLocation)fields.push('businessAddress','eventAddress','sameLocation','location');
 if(after.inventoryMode!==before.inventoryMode)fields.push('inventoryMode','ticketTiers','capacity');
 for(const key of ['restrictions','disclaimer','refundPolicy','supportiveMessage','paymentPreferences'])if(JSON.stringify(after[key])!==JSON.stringify(before[key]))fields.push(key);
 if(JSON.stringify(after.referrals)!==JSON.stringify(before.referrals))fields.push('referralEnabled','referralPercentage');
 return fields;
}
