import {creatorNeonCutoverEnabled,legacyPublishingClosedResponse} from '../../../lib/creator-neon-cutover.mjs';
import {parseListing,publicationErrors} from '../../../lib/listing.mjs';
import {connections,database,session,sameOrigin} from '../../../lib/services';
import {publicationPayload,eventPublicationPath,eventPublicationErrors} from '../../../lib/event-system.mjs';
import {localMode,localRequest,localStore} from '../../../lib/local-store.mjs';
export async function POST(request) {if(creatorNeonCutoverEnabled())return legacyPublishingClosedResponse();
  if(!sameOrigin(request)) return Response.json({error:'Please use the clickatick website.'},{status:403});
  if(localMode()&&!localRequest(request))return Response.json({error:'Use clickatick on this computer.'},{status:403});
  if(!connections().publishing) return Response.json({error:'Publishing is not connected yet. Your draft is kept on this device.'},{status:503});
  const auth=await session();
  if(!auth) return Response.json({error:'Log in before you publish.'},{status:401});
  try {
    const raw=await request.text();if(new TextEncoder().encode(raw).length>32768) throw new Error('Please shorten the listing.');
    const body=JSON.parse(raw),listing=parseListing(body.draft),errors=publicationErrors(listing);
    if(errors.length) return Response.json({error:errors.join(' ')},{status:400});
    const eventErrors=eventPublicationErrors(listing);
    if(eventErrors.length)return Response.json({error:eventErrors.join(' ')},{status:400});
    if(typeof body.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) throw new Error('The listing identifier is invalid.');
    if(localMode())await(await localStore()).publish(body.id,listing,auth.user.id);
    else await database(eventPublicationPath,{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY},body:JSON.stringify(publicationPayload(body.id,listing,auth.user.id))},process.env.SUPABASE_SERVICE_ROLE_KEY);
    return Response.json({url:`/listing/${body.id}`});
  } catch(error) {return Response.json({error:error.message},{status:400});}
}
