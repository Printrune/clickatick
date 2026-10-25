import {removePlannerEvent,plannerError} from '../../../../../lib/activity-planner.mjs';
export async function DELETE(request,{params}){try{const {source,id}=await params;await removePlannerEvent(request,source,id);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});}catch(error){return plannerError(error);}}
