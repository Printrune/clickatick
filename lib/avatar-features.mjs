// Styling from a detected face, never identity or demographic classification.
export class AvatarCaptureError extends Error {
  constructor(code) { super(code); this.name = 'AvatarCaptureError'; this.code = code; }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b, width, height) => Math.hypot((a.x-b.x)*width, (a.y-b.y)*height);
const hex = rgb => '#'+rgb.map(value=>Math.round(clamp(value,0,255)).toString(16).padStart(2,'0')).join('');
const difference = (a,b) => Math.hypot(...a.map((v,i)=>v-b[i]));
function median(values) { const sorted=values.toSorted((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]; }

function patch(image, x, y, radius) {
  const channels=[[],[],[]];
  for(let row=Math.max(0,Math.round(y-radius));row<=Math.min(image.height-1,y+radius);row+=2){
    for(let col=Math.max(0,Math.round(x-radius));col<=Math.min(image.width-1,x+radius);col+=2){
      const offset=(row*image.width+col)*4;
      if(image.data[offset+3]<200)continue;
      for(let c=0;c<3;c++)channels[c].push(image.data[offset+c]);
    }
  }
  return channels[0].length?channels.map(median):null;
}
function colorAt(image, point, radius){return patch(image,point.x*image.width,point.y*image.height,radius);}
function medianColor(colors){return [0,1,2].map(c=>median(colors.map(color=>color[c])));}

export function appearanceFromFace(image, landmarks) {
  if(!image?.data||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.data.length!==image.width*image.height*4)throw new AvatarCaptureError('unavailable');
  const required=[10,152,234,454,50,280,151];
  if(!Array.isArray(landmarks)||required.some(index=>!landmarks[index]||!Number.isFinite(landmarks[index].x)||!Number.isFinite(landmarks[index].y)))throw new AvatarCaptureError('no-face');
  const {width,height}=image;
  const forehead=landmarks[10],chin=landmarks[152],left=landmarks[234],right=landmarks[454];
  const facePixels=distance(left,right,width,height),faceLength=distance(forehead,chin,width,height);
  if(facePixels<width*.12||faceLength<height*.16||facePixels>width*.95||faceLength>height*.96)throw new AvatarCaptureError('no-face');
  if(required.some(index=>landmarks[index].x<.015||landmarks[index].x>.985||landmarks[index].y<.015||landmarks[index].y>.985))throw new AvatarCaptureError('no-face');
  const radius=Math.max(2,Math.round(facePixels*.035));
  const skinColors=[50,280,151].map(i=>colorAt(image,landmarks[i],radius)).filter(Boolean);
  if(!skinColors.length)throw new AvatarCaptureError('no-face');
  const skin=medianColor(skinColors);
  const center=(left.x+right.x)/2,top=forehead.y,faceHeight=faceLength/height,faceWidth=facePixels/width;
  // Landmark10 can sit below the visible hairline. Search several short bands,
  // requiring agreement across nearby patches, rather than coloring hair from skin.
  const candidates=[];
  for(const depth of [.10,.16,.22,.28]){
    const y=top-faceHeight*depth;
    if(y<=0||y>=1)continue;
    const background=[-.72,.72].map(dx=>colorAt(image,{x:center+dx*faceWidth,y},radius)).filter(Boolean);
    for(const dx of [-.24,0,.24]){
      const color=colorAt(image,{x:center+dx*faceWidth,y},radius);
      if(!color||difference(color,skin)<42)continue;
      // Nearby off-head patches reject curtains, walls and other backdrop colors.
      if(background.length&&background.every(sample=>difference(color,sample)<30))continue;
      candidates.push({color,depth});
    }
  }
  let group=[];
  for(const candidate of candidates){
    const neighbors=candidates.filter(sample=>difference(candidate.color,sample.color)<48);
    if(neighbors.length>group.length||neighbors.length===group.length&&candidate.depth<(group[0]?.depth??1))group=neighbors;
  }
  const hasHair=group.length>=2;
  // Ambiguous sampling keeps a restrained cropped style, never skin-orange hair.
  const hair=hasHair?medianColor(group.map(sample=>sample.color)):[58,45,42];
  // A jaw-only patch often sees clothing or background. Long hair requires a
  // continuous matching band from temple to lower face on both sides.
  const matchingSides=[-1,1].filter(side=>[.15,.35,.55,.72].every(depth=>{
    const color=colorAt(image,{x:center+side*faceWidth*.57,y:top+faceHeight*depth},radius);
    return color&&difference(color,hair)<38&&difference(color,skin)>38;
  })).length;
  // Hair length is only a coarse visual approximation; matching background can fool it.
  const hairStyle=!hasHair?'cropped':matchingSides===2?'long':'short';
  const ratio=facePixels/faceLength;
  return {
    skinColor:hex(skin),hairColor:hex(hair),hairStyle,
    faceWidth:Math.round(clamp(ratio/.78,.85,1.15)*1000)/1000,
    faceHeight:Math.round(clamp(.78/ratio,.85,1.15)*1000)/1000,
  };
}
