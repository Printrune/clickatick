import {sameOrigin} from '../../../lib/services';
import {handleSpeechRequest} from '../../../lib/speech-server.mjs';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request){return handleSpeechRequest(request,{sameOrigin});}
