import Workspace from '../../components/Workspace';
import {connections,session} from '../../lib/services';
export const dynamic='force-dynamic';
export const metadata={title:'Create tickets',description:'Create event and activity tickets through a conversation.'};
export default async function Creator(){const cutoverEnabled=process.env.CREATOR_NEON_CUTOVER_ENABLED==='true';const auth=cutoverEnabled?null:await session();return <Workspace connections={connections()} initialSignedIn={Boolean(auth)} cutoverEnabled={cutoverEnabled}/>;}
