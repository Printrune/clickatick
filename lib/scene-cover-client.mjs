const SVG_NS='http://www.w3.org/2000/svg';

// Capture the reviewed drawing, not the temporary camera frame used to style its avatar.
export async function captureSceneCover(container){
 const source=container?.querySelector('svg.scene-art');
 if(!source)throw new Error('The event illustration is not ready.');
 await document.fonts?.ready;
 await new Promise(resolve=>setTimeout(resolve,360));
 const copy=source.cloneNode(true);
 copy.setAttribute('xmlns',SVG_NS);
 copy.setAttribute('width','960');
 copy.setAttribute('height','660');
 copy.setAttribute('viewBox','0 0 640 440');
 const originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
 for(let i=0;i<originals.length;i++){
  const style=getComputedStyle(originals[i]);
  for(const property of ['opacity','transform','transform-origin','transform-box','font-family','font-size','font-weight','letter-spacing','text-anchor','dominant-baseline','visibility','display','color','fill','fill-opacity','fill-rule','stroke','stroke-opacity','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-dashoffset','paint-order','filter','clip-path','mask','stop-color','stop-opacity'])clones[i].style.setProperty(property,style.getPropertyValue(property));
  clones[i].removeAttribute('class');
 }
 const svg=new XMLSerializer().serializeToString(copy),blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);
 try{
  const image=new Image();image.src=url;await image.decode();
  for(const [width,quality] of [[960,.8],[800,.68],[640,.54],[640,.4]]){
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width*440/640);
   const context=canvas.getContext('2d');if(!context)throw new Error('This browser cannot prepare the event image.');
   const backdrop=context.createLinearGradient(0,0,width,canvas.height);backdrop.addColorStop(0,'#49466d');backdrop.addColorStop(1,'#1b1e35');context.fillStyle=backdrop;context.fillRect(0,0,width,canvas.height);
   context.drawImage(image,0,0,width,canvas.height);
   const dataUrl=canvas.toDataURL('image/jpeg',quality);
   if(dataUrl.length<=450000&&(dataUrl.length-23)*3/4<=340000)return {mime:'image/jpeg',dataUrl,origin:'scene'};
  }
  throw new Error('The event image is too large. You can publish without it.');
 }finally{URL.revokeObjectURL(url);}
}
