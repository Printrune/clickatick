import AcceptInvite from '../../../components/AcceptInvite';
import '../../organizer.css';
export const dynamic='force-dynamic';
export default async function InvitePage({params}){const {token}=await params;return <AcceptInvite token={token}/>;}
