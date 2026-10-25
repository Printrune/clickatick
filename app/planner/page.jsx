import ActivityPlanner from '../../components/ActivityPlanner';
import './planner.css';

export const metadata={title:'My activity planner | clickatick',description:'Plan events and activities you saved on Clickatick.',robots:{index:false,follow:false}};
export default function PlannerPage(){return <ActivityPlanner/>;}
