import {avatarStyle} from '../lib/scene-model.mjs';

// One light direction, rounded geometry and contact shadows across every figure.
// Coordinates are anchored at the soles, so all poses share their ground plane.
export default function ScenePerson({id, index=0, host=false, guide=false, halloween=false, format='', activity='idle', appearance}) {
  const avatar = avatarStyle(host ? appearance : undefined);
  const variant = host ? 0 : index % 6;
  const skin = host ? `url(#${id}-host-skin)` : `url(#${id}-skin-${index % 4})`;
  const coat = `url(#${id}-coat-${host ? 0 : 1 + index % 5})`;
  const hair = host ? avatar.hairColor : ['#302a42','#342b29','#4c3040','#b58c65','#282c3d','#7a594e'][variant];
  const broad = !host && index % 4 === 2;
  const tilt = host ? 0 : [-4,3,-2,2,0,-3][variant];
  return <g className={`scene-person ${host?'scene-person--host':''}`} data-activity={activity}>
    <ellipse cx="1" cy="1" rx={broad?30:26} ry="7" fill="#111021" opacity=".32"/>
    <g className="scene-person-body">
      <path d="M-19-49-21-9-6-7-1-44 6-7 22-9 18-49Z" fill={`url(#${id}-trousers)`}/>
      <path d="m-20-10-5 5q-4 6 2 7h19l1-10m10-1-1 10h23q5-2 0-6l-8-5" fill="#e4e1f2" stroke="#c4c0da" strokeWidth="1.2"/>
      <path d="M-23 0h18M8 0h23" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <path d={broad?'M-15-98q-23 2-24 24l9 30q29 8 59-1l7-31q-3-21-22-22Z':'M-12-98q-19 1-22 20l9 34q25 6 49-1l8-34q-2-18-20-19Z'} fill={coat}/>
      <path d="M-19-85q-7 18-2 35M-8-97q7 7 16 0" fill="none" stroke="#ffffff" strokeOpacity=".18" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M-26-51q25 7 52-1" fill="none" stroke="#161524" strokeOpacity=".18" strokeWidth="3"/>
      <rect x="-8" y="-111" width="16" height="20" rx="7" fill={skin}/>
      <path d="M-7-102q7 4 14 0" fill="none" stroke="#815d62" strokeOpacity=".25" strokeWidth="2"/>
      <g className="scene-head" style={{transform:host?undefined:`rotate(${tilt}deg)`}}>
        <g className="scene-face-features" style={host?{transform:`translateY(-130px) scale(${avatar.faceWidth},${avatar.faceHeight}) translateY(130px)`}:undefined}>
        {(variant===2||variant===5||host&&avatar.hairStyle==='long')&&<path d="M-22-136q-1-28 24-24 23-2 23 26l4 35q-29 9-53-1Z" fill={hair}/>}
        <ellipse cx="-21" cy="-126" rx="5" ry="8" fill={skin}/><ellipse cx="21" cy="-126" rx="5" ry="8" fill={skin}/>
        <path d="M-23-135q0-26 24-25 24 0 24 26l-3 17q-4 15-21 16-18-1-22-16Z" fill={skin}/>
        {host&&avatar.hairStyle==='cropped'?<path d="M-23-139q1-22 24-22 22 0 24 23l-6-7q-20-8-35 1Z" fill={hair}/>:variant===1?<><path d="M-23-134q-4-24 14-26 7-12 22-4 14-2 15 19l-5 12-6-15q-17 9-33-1Z" fill={hair}/><circle cx="-12" cy="-159" r="10" fill={hair}/><circle cx="2" cy="-164" r="10" fill={hair}/><circle cx="15" cy="-157" r="10" fill={hair}/></>:variant===3?<path d="M-23-138q0-23 24-23 24 1 25 24-12-4-19-12-10 12-30 11" fill={hair}/>:<path d="M-23-132q-6-28 18-31 28-6 33 23l-5 10-5-18q-21 12-35-1Z" fill={hair}/>}
        <>
          <g className="scene-eyes"><ellipse cx={host?-7:-10} cy="-129" rx="2.1" ry="3.1" fill="#332a38"/><ellipse cx={host?10:6} cy="-129" rx="2.1" ry="3.1" fill="#332a38"/></g>
          <path d={host?'m2-128 1 7-3 1':'m-2-128-2 7 3 1'} fill="none" stroke="#90696a" strokeWidth="1.6" strokeLinecap="round" opacity=".55"/>
          <path className="scene-mouth" d="M-6-113q6 4 12-1" fill="none" stroke="#79505c" strokeWidth="1.8" strokeLinecap="round"/>
          <ellipse cx="-13" cy="-119" rx="4" ry="2" fill="#de8d8a" opacity=".3"/><ellipse cx="14" cy="-119" rx="4" ry="2" fill="#de8d8a" opacity=".3"/>
          {variant===4&&<g fill="none" stroke="#4b435e" strokeWidth="1.7"><rect x="-18" y="-135" width="13" height="12" rx="4"/><rect x="0" y="-135" width="13" height="12" rx="4"/><path d="M-5-130h5"/></g>}
        </>
        </g>
      </g>
      {host&&guide&&<g><path d="M-10-96 0-70 10-96" fill="none" stroke="#d1ffb0" strokeWidth="2.4"/><rect x="-6" y="-71" width="12" height="16" rx="2" fill="#e1ffd2"/><rect x="-4" y="-67" width="8" height="5" rx="1" fill="#787098"/><path d="M-3-59h6" stroke="#787098"/></g>}
      <g className={`scene-arm scene-arm--left ${format?'scene-arm--holding':''}`}>
        <path d="M-25-85-34-67" fill="none" stroke={coat} strokeWidth="14" strokeLinecap="round"/>
        {(format||host&&halloween)?<>
          <path d="M-34-67-42-79" fill="none" stroke={skin} strokeWidth="10" strokeLinecap="round"/>
          <g className="scene-ticket" data-format={format}>
            {format==='digital'&&<g transform="translate(-48 -102) rotate(-8 8 14)"><rect width="18" height="29" rx="4" fill="#29273d" stroke="#e4ddff" strokeWidth="1.2"/><rect x="3" y="4" width="12" height="20" rx="1.5" fill="#ceffb5"/><path d="M6 8h3v3H6Zm5 0h2v3h-2ZM6 13h2v2H6Zm4-1h3v3h-3Zm-4 6h7" fill="#354740" stroke="#354740" strokeWidth=".8"/><path d="M7 2h4" stroke="#a39bb9" strokeLinecap="round"/></g>}
            {format==='paper'&&<g transform="translate(-54 -97) rotate(-13 13 10)"><path d="M1 1h28v6q-5 3 0 6v7H1v-7q5-3 0-6Z" fill="#ffe6b3" stroke="#cfaa73" strokeWidth="1"/><path d="M9 3v15" stroke="#b38d5a" strokeWidth="1" strokeDasharray="2 2"/><path d="M13 6h11m-11 4h8m-8 4h10" stroke="#8b725a" strokeWidth="1.3"/></g>}
            {host&&halloween&&!format&&<g transform="translate(-45 -77)"><path d="M-5 11V5q0-10 7-10t7 10v6" fill="none" stroke="#ffdb9a" strokeWidth="2.5"/><path d="M-9 13 2 8l12 5v24l-12 5-11-5Z" fill={`url(#${id}-lantern)`} stroke="#9c725a" strokeWidth="1.5"/><path d="M-5 16v18m13-18v18M-7 15h18M-7 36h18" stroke="#9b725e" strokeWidth="1.5"/><ellipse cx="2" cy="26" rx="4" ry="7" fill="#fff5cf"/></g>}
          </g>
          <path d="m-44-78 6 3" stroke={skin} strokeWidth="6" strokeLinecap="round"/>
        </>:<><path d="M-34-67-29-48" fill="none" stroke={skin} strokeWidth="10" strokeLinecap="round"/><ellipse cx="-28" cy="-46" rx="5" ry="7" fill={skin}/></>}
      </g>
      <g className={`scene-arm scene-arm--right ${host?'scene-gesture':''}`}>
        {host?<><path d="M25-85 39-76" fill="none" stroke={coat} strokeWidth="14" strokeLinecap="round"/><path d="M39-76 53-93" fill="none" stroke={skin} strokeWidth="10" strokeLinecap="round"/><path d="m53-93 8-7m-8 7 10-1m-10 1 3-10" stroke={skin} strokeWidth="5" strokeLinecap="round"/></>:variant%3===1?<><path d="M25-84 38-67" fill="none" stroke={coat} strokeWidth="13" strokeLinecap="round"/><path d="M38-67 22-57" fill="none" stroke={skin} strokeWidth="9" strokeLinecap="round"/><ellipse cx="21" cy="-57" rx="7" ry="4" fill={skin}/></>:<><path d="M25-84 30-65" fill="none" stroke={coat} strokeWidth="13" strokeLinecap="round"/><path d="M30-65 26-47" fill="none" stroke={skin} strokeWidth="9" strokeLinecap="round"/><ellipse cx="26" cy="-45" rx="5" ry="7" fill={skin}/></>}
      </g>
    </g>
  </g>;
}
