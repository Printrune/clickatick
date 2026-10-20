/** Keep the latest complete conversational turns while carrying the full listing draft. */
import {parseConversationState} from './conversation-state.mjs';
export function chatPayload(messages,draft,conversationState){
 const state=parseConversationState(conversationState);
 const recent=messages.filter(message=>message.role==='user'||message.role==='assistant').slice(-20);
 while(recent[0]?.role==='assistant')recent.shift();
 const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).length;
 while(recent.length>1&&bytes({messages:recent,draft,conversationState:state})>23000){recent.shift();while(recent[0]?.role==='assistant')recent.shift();}
 const result={messages:recent,draft,conversationState:state};if(!recent.length||bytes(result)>23000)throw new Error('These listing details are too long for a chat request. Shorten the description or guest information, then try again.');return result;
}
