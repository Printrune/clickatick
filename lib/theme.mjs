export const THEME_STORAGE_KEY='clickatick-theme';
export const normaliseTheme=value=>value==='light'?'light':'dark';
export function readTheme(storage){try{return normaliseTheme(storage.getItem(THEME_STORAGE_KEY));}catch{return 'dark';}}
export function applyTheme(root,value){const theme=normaliseTheme(value);root.dataset.theme=theme;root.style.colorScheme=theme;return theme;}
export function saveTheme(root,storage,value){const theme=applyTheme(root,value);try{storage.setItem(THEME_STORAGE_KEY,theme);}catch{}return theme;}
// Static, dependency-free bootstrap runs in the document head before visible content.
export const THEME_BOOTSTRAP=`(()=>{let theme='dark';try{theme=localStorage.getItem('${THEME_STORAGE_KEY}')==='light'?'light':'dark';}catch{}document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;})();`;
