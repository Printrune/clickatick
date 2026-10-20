import Workspace from '../components/Workspace';
import {connections,session} from '../lib/services';
export const dynamic='force-dynamic';
export default async function Home(){const auth=await session();return <Workspace connections={connections()} initialSignedIn={Boolean(auth)}/>;}
