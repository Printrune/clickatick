export const TILE=256,MIN_ZOOM=9,MAX_ZOOM=13;
export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function worldPoint(lat,lng,zoom){const world=TILE*2**zoom,sin=Math.sin(clamp(lat,-85,85)*Math.PI/180);return {x:(lng+180)/360*world,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*world};}
export function geoPoint(x,y,zoom){const world=TILE*2**zoom;return {lng:x/world*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*y/world)))*180/Math.PI};}
export function mapBounds(center,width,height,zoom){const point=worldPoint(center.lat,center.lng,zoom);const nw=geoPoint(point.x-width/2,point.y-height/2,zoom),se=geoPoint(point.x+width/2,point.y+height/2,zoom);return [nw.lng,se.lat,se.lng,nw.lat].map(x=>x.toFixed(5)).join(',');}
