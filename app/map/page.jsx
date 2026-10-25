import EventMap from '../../components/EventMap';
import './map.css';

export const metadata={title:'Event map',description:'Explore events by location. Open event details on Clickatick and plan activities before buying tickets.',robots:{index:false,follow:true}};
export default function MapPage(){return <EventMap/>;}
