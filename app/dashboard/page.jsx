import DashboardEntry from '../../components/DashboardEntry';
import '../organizer.css';
export const dynamic='force-dynamic';
export const metadata={title:'Organizer dashboard'};
export default async function Dashboard({searchParams}){const {source}=await searchParams;return <DashboardEntry source={source==='creator'?'creator':'manual'}/>;}
