'use client';

import {useEffect, useId, useRef, useState} from 'react';
import ScenePerson from './ScenePerson';
import {CROWD_PLACES, appendSceneAnswer, avatarStyle, changedSceneFacts, sceneModel, sceneTheme, ticketForGuest} from '../lib/scene-model.mjs';
import '../app/event-scene.css';

export {sceneTheme};

const COATS = [['#c9bcff','#8071ba'],['#a1cdd6','#537d97'],['#f0ba97','#b77569'],['#d9d496','#969760'],['#c1ace5','#786d9c'],['#9bc8b8','#558f85']];
const SKINS = [['#f3d3bb','#c49786'],['#c89477','#93614e'],['#9c6b59','#69473d'],['#e2b79a','#b57f68']];
const ACTIVITY = {idle:'Your event in the making',listening:'Listening to your idea',thinking:'Building from your answer',speaking:'Talking it through'};

function SceneDefs({id,light,appearance}) {
  const avatar=avatarStyle(appearance);
  const skinShade=`#${avatar.skinColor.slice(1).match(/.{2}/g).map(channel=>Math.round(parseInt(channel,16)*.74).toString(16).padStart(2,'0')).join('')}`;
  const sky = light==='night'?['#3e3a69','#171b31']:light==='evening'?['#73536f','#252641']:light==='day'?['#657d99','#282f4b']:['#51496f','#23253f'];
  return <defs>
    <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={sky[0]}/><stop offset="1" stopColor={sky[1]}/></linearGradient>
    <radialGradient id={`${id}-halo`}><stop stopColor="#bda6ee" stopOpacity=".45"/><stop offset="1" stopColor="#bda6ee" stopOpacity="0"/></radialGradient>
    <linearGradient id={`${id}-ground`} x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#777b9c"/><stop offset=".7" stopColor="#555b7c"/><stop offset="1" stopColor="#494765"/></linearGradient>
    <linearGradient id={`${id}-edge`} x2="0" y2="1"><stop stopColor="#53516f"/><stop offset="1" stopColor="#27253f"/></linearGradient>
    <linearGradient id={`${id}-trousers`}><stop stopColor="#34364e"/><stop offset=".55" stopColor="#535973"/><stop offset="1" stopColor="#33364c"/></linearGradient>
    <linearGradient id={`${id}-lantern`}><stop stopColor="#ffcf89"/><stop offset=".55" stopColor="#fff0b5"/><stop offset="1" stopColor="#d68a5d"/></linearGradient>
    <linearGradient id={`${id}-leaf`}><stop stopColor="#9db9a7"/><stop offset=".5" stopColor="#678a86"/><stop offset="1" stopColor="#3b5e67"/></linearGradient>
    <linearGradient id={`${id}-pumpkin`}><stop stopColor="#f8c495"/><stop offset=".55" stopColor="#e79d6d"/><stop offset="1" stopColor="#ae6c5a"/></linearGradient>
    {COATS.map(([a,b],i)=><linearGradient key={`coat-${i}`} id={`${id}-coat-${i}`} x2=".85" y2=".55"><stop stopColor={a}/><stop offset=".5" stopColor={a}/><stop offset="1" stopColor={b}/></linearGradient>)}
    {SKINS.map(([a,b],i)=><linearGradient key={`skin-${i}`} id={`${id}-skin-${i}`} x2=".85" y2=".55"><stop stopColor={a}/><stop offset=".5" stopColor={a}/><stop offset="1" stopColor={b}/></linearGradient>)}
    <linearGradient id={`${id}-host-skin`} x2=".85" y2=".55"><stop stopColor={avatar.skinColor}/><stop offset=".55" stopColor={avatar.skinColor}/><stop offset="1" stopColor={skinShade}/></linearGradient>
  </defs>;
}

function Pumpkin({id,x,y,scale=1}) {return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cy="8" rx="25" ry="7" fill="#17192d" opacity=".25"/><path d="M-2-23q-5-13 5-15" fill="none" stroke="#95a386" strokeWidth="5" strokeLinecap="round"/><ellipse cy="-8" rx="25" ry="21" fill={`url(#${id}-pumpkin)`}/><path d="M-4-28q-13 21 0 41M5-28q13 21 0 41" fill="none" stroke="#a86a54" strokeOpacity=".35" strokeWidth="2"/><path d="m-14-11 7-5 2 6m8 0 2-6 7 5m-24 9q12 12 24-1" fill="#654449" stroke="#654449" strokeWidth="1.6" strokeLinejoin="round"/></g>}

function Tree({id,x,y,scale=1}) {return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cy="2" rx="27" ry="7" fill="#10192d" opacity=".25"/><path d="M-5 0-3-75h11L6 0Z" fill="#726770"/><path d="m2-40-16-18m18 5 14-20" stroke="#726770" strokeWidth="5" strokeLinecap="round"/><path d="M-32-68q-27-36 0-53-5-35 26-36 26-22 42 8 27 6 18 34 24 25-5 48-45 20-81-1" fill={`url(#${id}-leaf)`}/><path d="M-24-92q-12-19 2-31m15-10q11-10 20-1" fill="none" stroke="#d6e1c8" strokeOpacity=".2" strokeWidth="6" strokeLinecap="round"/></g>}

function SceneSetting({id,model}) {
  const has = cue => model.cues.includes(cue);
  return <>
    <g className="scene-cue scene-route-board" data-visible={has('tour')}>
      <ellipse cx="386" cy="273" rx="39" ry="8" fill="#171c32" opacity=".2"/>
      <path d="M345 144v129m88-129v129" stroke="#686783" strokeWidth="6" strokeLinecap="round"/>
      <rect x="312" y="104" width="154" height="100" rx="15" fill="#45455f" stroke="#aaa4c6" strokeWidth="1.4"/>
      <rect x="318" y="110" width="142" height="88" rx="11" fill="#56566e"/>
      <path d="M330 181q-2-28 29-27t41-6q9-24 43-20" fill="none" stroke="#d5e4b5" strokeWidth="3" strokeDasharray="4 5" strokeLinecap="round"/>
      <circle cx="330" cy="181" r="4" fill="#c5dca2"/><circle cx="376" cy="155" r="4" fill="#c5dca2"/>
      <path d="M451 128c0 9-8 14-8 14s-8-5-8-14a8 8 0 0 1 16 0Z" fill="#e3edc8"/><circle cx="443" cy="127" r="2.5" fill="#657276"/>
      <text x="329" y="131" fill="#e0dcf0" fontSize="13" fontWeight="500">Tour</text>
    </g>
    <g className="scene-cue scene-cue--sky" data-visible={model.light!=='neutral'}>
      {model.light==='night'?<><circle cx="526" cy="85" r="31" fill="#f4e8cb"/><circle cx="535" cy="76" r="6" fill="#c5bfd0" opacity=".5"/><circle cx="515" cy="98" r="4" fill="#c5bfd0" opacity=".5"/>{[[95,77],[385,55],[578,145],[440,118]].map(([x,y])=><path key={x} d={`M${x-3} ${y}h6m-3-3v6`} stroke="#dadcf1" strokeWidth="1.4"/>)}</>:<circle cx="526" cy="85" r="31" fill={model.light==='evening'?'#f5bca0':'#f8e7b6'}/>}
    </g>
    <g className="scene-cue" data-visible={model.indoors}><path d="M56 280V95q0-16 16-16h506q16 0 16 16v185" fill="none" stroke="#b2a7d3" strokeOpacity=".25" strokeWidth="3"/><path d="M72 95h57v130H72Zm439 0h57v130h-57Z" fill="#cfc8e4" opacity=".08"/></g>
    <g className="scene-cue" data-visible={model.outdoors}><Tree id={id} x={81} y={307} scale={.75}/><Tree id={id} x={568} y={274} scale={.72}/></g>
    <g className="scene-cue scene-story-motif" data-visible={model.ghostStories}><path d="M92 161v-27q0-17 16-17t16 17v27l-8-6-8 6-8-6Z" fill="#c9c5e0" opacity=".65"/><ellipse cx="103" cy="135" rx="2" ry="3" fill="#6e6589"/><ellipse cx="114" cy="135" rx="2" ry="3" fill="#6e6589"/><path d="m552 170 9-9 8 6 8-6 9 9-11-2-6 9-6-9Z" fill="#baa9d2" opacity=".5"/></g>
    <g className="scene-cue" data-visible={has('music')}>
      <g transform="translate(80 228)"><ellipse cy="66" rx="33" ry="9" fill="#1c1d32" opacity=".25"/><path d="M-21-33 16-39l9 7V63l-46 2Z" fill="#3d3e58"/><path d="m16-39 10 7v94l-10 3Z" fill="#262a42"/><circle cx="-2" cy="33" r="16" fill="#282d43" stroke="#737b9d" strokeWidth="3"/><circle cx="-2" cy="33" r="6" fill="#606785"/><circle cx="-2" cy="-11" r="9" fill="#292b43" stroke="#77809c" strokeWidth="2"/></g>
      <g fill="#cedfa6"><path d="M476 142v-38l32-7v35l-7 2v-24l-18 4v26Z"/><ellipse cx="473" cy="142" rx="9" ry="6" transform="rotate(-15 473 142)"/><ellipse cx="498" cy="134" rx="9" ry="6" transform="rotate(-15 498 134)"/></g>
    </g>
    <g className="scene-cue" data-visible={has('workshop')||has('food')}>
      <g transform="translate(464 230)"><ellipse cy="55" rx="71" ry="17" fill="#202039" opacity=".2"/><path d="m-51-4 7 53m87-48-6 50" fill="none" stroke="#7b6571" strokeWidth="8" strokeLinecap="round"/><path d="m-64-14 63-22 76 25-61 24Z" fill="#cfb9ad"/><path d="m-64-14v8L14 21l61-24v-8L14 13Z" fill="#a88f87"/>
        {has('workshop')&&(model.pottery?<><ellipse cx="2" cy="-17" rx="20" ry="7" fill="#a18a82"/><path d="M-12-22q-7-24 14-23 21-1 14 23-11 11-28 0Z" fill="#dba78f"/><ellipse cx="2" cy="-44" rx="11" ry="4" fill="#9f7668"/></>:<><path d="m-29-17 25-9 28 10-24 8Z" fill="#f1ebdd"/><path d="m-16-18 18 5m-13-10 20 6" stroke="#a8a0af" strokeWidth="1.5"/><path d="m34-21 7-27m-3 29 11-20" stroke="#c4d4ad" strokeWidth="4" strokeLinecap="round"/></>)}
        {has('food')&&<g transform="translate(-5 -21)"><ellipse cy="-2" rx="24" ry="8" fill="#ede5dc"/><path d="M-24-2q3 24 24 22 21 1 24-22Z" fill="#c8b6b5"/><ellipse cy="-2" rx="19" ry="5" fill="#a5b596"/><path d="m-5-5 4-8 7 9" fill="#d5d7aa"/></g>}
      </g>
    </g>
  </>;
}

function FactIcon({kind}) {return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{kind==='location'?<><path d="M15.5 8c0 4-5.5 9-5.5 9S4.5 12 4.5 8a5.5 5.5 0 0 1 11 0Z"/><circle cx="10" cy="8" r="1.7"/></>:kind==='time'||kind==='duration'?<><circle cx="10" cy="10" r="7"/><path d="M10 5v5l3 2"/></>:kind==='date'||kind==='schedule'?<><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2v4m6-4v4M6 11h3m2 0h3m-8 3h3"/></>:kind==='idea'||kind==='title'?<><path d="M7 14c0-3-3-3-3-7a6 6 0 0 1 12 0c0 4-3 4-3 7ZM7 17h6M8 14h4"/></>:<><path d="M3 5h14v4q-3 1 0 3v3H3v-3q3-2 0-3Z"/><path d="M7 6v8" strokeDasharray="2 2"/></>}</svg>;}

const shortLabel=(text,length=24)=>text.length>length?`${text.slice(0,length-1)}…`:text;

// These signs and props occupy fixed places in the world. Updates replace only
// their lettering or small detail, leaving the host and crowd undisturbed.
function IllustratedFacts({model,changed}) {
  const animated=(key)=>`scene-world-fact ${changed.includes(key)?'scene-world-fact--changed':''}`;
  return <g className="scene-world-facts">
    <g className={animated('title')} data-visible={Boolean(model.title)}>
      <path d="M116 38q0-9 9-9h390q9 0 9 9v30H116Z" fill="#282c44" stroke="#9c90ba" strokeWidth="1.2"/>
      <path d="m116 67-16 12V50l16-10m408 27 16 12V50l-16-10" fill="#57516f"/>
      <text x="320" y="55" textAnchor="middle" fill="#f4edf9" fontSize="17" fontWeight="550">{shortLabel(model.title,41)}</text>
    </g>
    <g transform="translate(-180 -129)"><g className={animated('location')} data-visible={Boolean(model.location)}>
      <path d="M563 218v83" stroke="#a399b3" strokeWidth="5" strokeLinecap="round"/>
      <path d="M493 204h121l13 17-13 17H493Z" fill="#c5d8b0" stroke="#e4edd2" strokeWidth="1.2"/>
      <path d="M505 214a4 4 0 1 1 8 0c0 4-4 8-4 8s-4-4-4-8Z" fill="#566655"/>
      <text x="519" y="225" fill="#354a42" fontSize="12" fontWeight="600">{shortLabel(model.location,14)}</text>
    </g></g>
    <g className={animated('date')} data-visible={Boolean(model.date||model.schedule||model.time)}>
      <rect x="462" y="84" width="111" height="89" rx="10" fill="#d9d0e3" stroke="#eee7f6" strokeWidth="1.3"/>
      <path d="M462 96q0-12 12-12h87q12 0 12 12v11H462Z" fill="#9380b0"/>
      <path d="M484 79v12m67-12v12" stroke="#ede6f4" strokeWidth="4" strokeLinecap="round"/>
      <text x="517" y="128" textAnchor="middle" fill="#413d5a" fontSize="18" fontWeight="600">{model.date||shortLabel(model.schedule,13)||model.time}</text>
      <text x="517" y="150" textAnchor="middle" fill="#5d5574" fontSize="11">{shortLabel(model.schedule||model.time,18)}</text>
      {model.time&&<g className={animated('time')}><circle cx="579" cy="165" r="25" fill="#eef0df" stroke="#959a94" strokeWidth="3"/><path d="M579 165v-13" transform={`rotate(${model.clock.hour} 579 165)`} fill="none" stroke="#5a6263" strokeWidth="2.6" strokeLinecap="round"/><path d="M579 165v-19" transform={`rotate(${model.clock.minute} 579 165)`} fill="none" stroke="#5a6263" strokeWidth="1.8" strokeLinecap="round"/><circle cx="579" cy="165" r="2.5" fill="#5a6263"/></g>}
    </g>
    <g className={animated('duration')} data-visible={Boolean(model.duration)}>
      <ellipse cx="73" cy="313" rx="32" ry="9" fill="#14192d" opacity=".24"/>
      <rect x="66" y="227" width="14" height="11" rx="3" fill="#d8d4e5"/><circle cx="73" cy="272" r="33" fill="#e2dded" stroke="#a29dbb" strokeWidth="3"/>
      <path d="M73 247v20l13-10" fill="none" stroke="#8876aa" strokeWidth="3" strokeLinecap="round"/>
      <text x="73" y="288" textAnchor="middle" fill="#4e4968" fontSize="12" fontWeight="600">{model.duration}</text>
    </g>
    <g className={animated('price')} data-visible={Boolean(model.price||model.ticketNames.length)}>
      <ellipse cx="126" cy="415" rx="83" ry="10" fill="#16172c" opacity=".25"/>
      <g transform="translate(51 363) rotate(-5 70 20)">
        <path d="M4 0h142v15q-12 5 0 10v23H4V25q12-5 0-10Z" fill="#dfdeb7" stroke="#f0edcf" strokeWidth="1.3"/>
        <path d="M28 4v40" stroke="#8e936d" strokeWidth="1.5" strokeDasharray="3 3"/>
        <text x="39" y="20" fill="#414e42" fontSize="13" fontWeight="650">{model.price?shortLabel(model.price,19):'Ticket types'}</text>
        <text x="39" y="36" fill="#5e6650" fontSize="11">{shortLabel(model.ticketDesigns[0]?[model.ticketDesigns[0].name,model.ticketDesigns[0].price].filter(Boolean).join(' '):model.facts.format,21)}</text>
      </g>
      {model.ticketDesigns.slice(1,3).map((ticket,index)=><g key={index} transform={`translate(${59+index*7} ${410+index*13})`}><g className={animated('tickets')}><path d="M0 0h142v13H0Z" fill={index?'#b8a5d0':'#c9b8dc'} stroke="#e1d4ed" strokeWidth="1"/><text x="8" y="10" fill="#40394f" fontSize="10">{shortLabel([ticket.name,ticket.price].filter(Boolean).join(' '),24)}</text></g></g>)}
    </g>
  </g>;
}

export default function EventScene({draft={},appearance,compact=false,activity='idle',revision=0,answerNote=''}) {
  const id=useId().replace(/:/g,'');
  const model=sceneModel(draft);
  const previous=useRef(null);
  const [changed,setChanged]=useState([]);
  const [answers,setAnswers]=useState([]);
  const [expandedAnswer,setExpandedAnswer]=useState(null);
  const signature=JSON.stringify(model.facts);
  useEffect(()=>{
    const keys=changedSceneFacts(previous.current,model);
    previous.current=model;
    setAnswers(current=>appendSceneAnswer(current,revision,answerNote,keys));
    if(!keys.length) {setChanged(current=>current.length?[]:current);return;}
    setChanged(keys);
    const timeout=setTimeout(()=>setChanged([]),2400);
    return ()=>clearTimeout(timeout);
  // Only accepted fact changes replay the acknowledgment, never listening changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[signature,revision,answerNote]);
  const has=cue=>model.cues.includes(cue);
  const currentActivity=Object.hasOwn(ACTIVITY,activity)?activity:'idle';
  const displayCapacity=model.capacity?`${model.capacity.toLocaleString('en-US')} guest places`:'Room for your idea';
  const crowdPlaces=CROWD_PLACES.map((place,index)=>({...place,index})).sort((a,b)=>a.y-b.y);
  const sceneDescription=[model.title||'Your event illustration',model.facts.location,model.facts.time,model.facts.capacity,model.facts.format,model.capacity>20?'20 figures represent the larger group':''].filter(Boolean).join('. ');
  return <figure className={`event-scene event-scene--${model.theme}${compact?' event-scene--compact':''}`} data-light={model.light} data-activity={currentActivity} data-has-crowd={model.count>0} aria-label={sceneDescription}>
    {!compact&&<div className="scene-status"><span className={`scene-activity scene-activity--${currentActivity}`}><i/><i/><i/></span><span>{ACTIVITY[currentActivity]}</span>{changed.length>0&&<span className="scene-updated" role="status">Scene updated</span>}</div>}
    <svg className="scene-art" viewBox={compact?'100 20 440 400':'0 0 640 440'} aria-hidden="true">
      <SceneDefs id={id} light={model.light} appearance={appearance}/>
      <ellipse cx="320" cy="239" rx="298" ry="240" fill={`url(#${id}-halo)`}/>
      {!compact&&<path d="M35 327V175C35 48 132 17 320 17s285 31 285 158v152Z" fill={`url(#${id}-sky)`} opacity=".5"/>}
      <ellipse cx="323" cy="416" rx="258" ry="16" fill="#080b20" opacity=".24"/>
      <path d="M38 336c0-49 127-88 285-88s285 39 285 88v15c0 50-127 88-285 88S38 401 38 351Z" fill={`url(#${id}-edge)`}/>
      <ellipse cx="323" cy="336" rx="285" ry="88" fill={`url(#${id}-ground)`}/>
      <path d="M39 336c0-48 126-87 284-87 156 0 280 38 284 85" fill="none" stroke="#c7c1e2" strokeOpacity=".3" strokeWidth="2"/>
      {!compact&&<>
        <g className="scene-cue" data-visible={has('tour')}><path d="M110 362c23-31 49-39 79-27 43 18 63 17 82-6 26-31 87-19 117-39" fill="none" stroke="#d7eac0" strokeOpacity=".38" strokeWidth="18" strokeLinecap="round"/><path d="M110 362c23-31 49-39 79-27 43 18 63 17 82-6 26-31 87-19 117-39" fill="none" stroke="#dcebc9" strokeWidth="1.8" strokeDasharray="4 8" strokeLinecap="round"/><circle cx="110" cy="362" r="5" fill="#e6f9cb"/></g>
        <g className="scene-cue" data-visible={has('movement')}><path d="m98 334 94-29 97 33-93 33Z" fill="#afa6d2" stroke="#d0c7e5" strokeWidth="1.5"/><path d="m107 334 89 29 82-25" fill="none" stroke="#8e84b2" strokeWidth="3"/></g>
        <SceneSetting id={id} model={model}/>
        <g className="scene-cue" data-visible={has('halloween')}><Pumpkin id={id} x={99} y={348} scale={.9}/><Pumpkin id={id} x={60} y={331} scale={.5}/></g>
      </>}
      <g className="scene-host-position" style={{transform:compact?'translate(307px, 355px) scale(1.9)':model.known?'translate(177px, 345px) scale(1.52)':'translate(303px, 354px) scale(1.72)'}}>
        <ScenePerson id={id} host guide={has('tour')} halloween={has('halloween')} activity={currentActivity} appearance={appearance}/>
      </g>
      {!compact&&crowdPlaces.map(({x,y,scale,index})=><g key={index} transform={`translate(${x} ${y}) scale(${scale})`}><g className="scene-guest" data-visible={index<model.count} style={{transitionDelay:index<model.count?`${Math.min(index%5*35,140)}ms`:'0ms'}}><ScenePerson id={id} index={index} format={ticketForGuest(model.format,index)}/></g></g>)}
      {!compact&&model.known&&<g stroke="#d3e6c0" strokeOpacity=".5" strokeWidth="1.5"><path d="M100 389 116 394m-9-10 17 5m427-15 14-6m-9 14 14-7" fill="none" strokeLinecap="round"/></g>}
      {!compact&&<IllustratedFacts model={model} changed={changed}/>}
    </svg>
    {!compact&&answers.length>0&&<div className="scene-answer-journal" aria-label="Your answer notes">{answers.map((answer,index)=><button type="button" key={answer.revision} aria-label={`Your answer note: ${answer.text}`} aria-expanded={expandedAnswer===answer.revision} onClick={()=>setExpandedAnswer(current=>current===answer.revision?null:answer.revision)} className={`scene-answer-tile${index===answers.length-1?' scene-answer-tile--latest':''}`}><FactIcon kind={answer.kind}/><span>{answer.text}</span><span className="scene-answer-check" aria-hidden="true">✓</span></button>)}</div>}
    {!compact&&<figcaption className="scene-caption">
      <div className="scene-capacity-line"><strong className={changed.includes('capacity')?'scene-fact scene-fact--changed':'scene-fact'}>{displayCapacity}{model.capacity>20&&<span className="scene-representative">20 shown</span>}</strong>{model.facts.format&&<span className={changed.includes('format')?'scene-ticket-label scene-fact--changed':'scene-ticket-label'}><FactIcon kind="ticket"/>{model.facts.format}</span>}</div>
      <div className="scene-facts">{['location','time','duration','price'].filter(key=>model.facts[key]).map(key=><span key={key} className={changed.includes(key)?'scene-fact scene-fact--changed':'scene-fact'}><FactIcon kind={key}/>{model.facts[key]}</span>)}{model.ticketNames.length>0&&<span className={changed.includes('tickets')?'scene-fact scene-fact--changed':'scene-fact'} title={model.facts.tickets}><FactIcon kind="ticket"/>{model.ticketNames.length===1?model.ticketNames[0]:`${model.ticketNames.length} ticket types`}</span>}</div>
      {!model.capacity&&<p className="scene-explanation">Your answers add people, tickets and details.</p>}
    </figcaption>}
  </figure>;
}
