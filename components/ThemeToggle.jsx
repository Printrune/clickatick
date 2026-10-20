'use client';
import {useEffect,useState} from 'react';
import {THEME_STORAGE_KEY,normaliseTheme,readTheme,applyTheme,saveTheme} from '../lib/theme.mjs';
export default function ThemeToggle(){
 const [theme,setTheme]=useState('dark');
 useEffect(()=>{let storage;try{storage=window.localStorage;}catch{}setTheme(applyTheme(document.documentElement,document.documentElement.dataset.theme||readTheme(storage)));const sync=event=>{if(event.key===THEME_STORAGE_KEY||event.key===null)setTheme(applyTheme(document.documentElement,event.newValue));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 function toggle(){const next=normaliseTheme(document.documentElement.dataset.theme)==='light'?'dark':'light';let storage;try{storage=window.localStorage;}catch{}setTheme(saveTheme(document.documentElement,storage,next));}
 return <button className="theme-toggle" type="button" role="switch" aria-checked={theme==='light'} aria-label="Light mode" onClick={toggle}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg><span className="theme-toggle-label">Light mode</span><span className="theme-switch-track" aria-hidden="true"><i/></span></button>;
}
