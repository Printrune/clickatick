import {PhaseA1Error} from './integrated-phase-a1.mjs';
const reject=()=>{throw new PhaseA1Error('UNSUPPORTED_MEDIA_CODEC','Use an MP4 with H.264 video and AAC audio.',422);};
const u32=(b,p)=>b.readUInt32BE(p);
function boxes(b,start,end){const out=[];for(let p=start;p<end;){if(p+8>end)reject();const n=u32(b,p),type=b.toString('ascii',p+4,p+8);if(n<8||n===1||p+n>end)reject();out.push({type,start:p+8,end:p+n});p+=n;}return out;}
function child(b,box,type){return boxes(b,box.start,box.end).filter(x=>x.type===type);}
function descriptor(b,start,end,tag){for(let p=start;p<end-2;p++){if(b[p]!==tag)continue;let length=0,q=p+1;for(let i=0;i<4;i++){if(q>=end)break;const v=b[q++];length=(length<<7)|(v&127);if(!(v&128)){if(q+length<=end)return b.subarray(q,q+length);break;}}}return null;}
/** Strict bounded ISO-BMFF track inspection. Rejects unfamiliar sample entries or ambiguous tracks. */
export function inspectH264AacMp4(input){
 if(!(input instanceof Uint8Array)||input.byteLength<32||input.byteLength>100000000)reject();
 const b=Buffer.from(input.buffer,input.byteOffset,input.byteLength),top=boxes(b,0,b.length);
 if(!top.some(x=>x.type==='ftyp')||!top.some(x=>x.type==='mdat')||top.filter(x=>x.type==='moov').length!==1||top.some(x=>x.type==='moof'))reject();
 const moov=top.find(x=>x.type==='moov'),tracks=child(b,moov,'trak');if(!tracks.length||tracks.length>16)reject();
 let video=0,audio=0;
 for(const trak of tracks){const mdia=child(b,trak,'mdia');if(mdia.length!==1)reject();const hdlr=child(b,mdia[0],'hdlr');if(hdlr.length!==1||hdlr[0].start+12>hdlr[0].end)reject();const kind=b.toString('ascii',hdlr[0].start+8,hdlr[0].start+12);if(kind!=='vide'&&kind!=='soun')continue;
  const minf=child(b,mdia[0],'minf');if(minf.length!==1)reject();const stbl=child(b,minf[0],'stbl');if(stbl.length!==1)reject();const stsd=child(b,stbl[0],'stsd');if(stsd.length!==1||stsd[0].start+8>stsd[0].end||u32(b,stsd[0].start+4)!==1)reject();
  const entries=boxes(b,stsd[0].start+8,stsd[0].end);if(entries.length!==1)reject();const entry=entries[0];
  if(kind==='vide'){if(entry.type!=='avc1'||entry.start+78>entry.end)reject();const config=boxes(b,entry.start+78,entry.end).find(x=>x.type==='avcC');if(!config||config.end-config.start<7||b[config.start]!==1||!b[config.start+1])reject();video++;}
  else {if(entry.type!=='mp4a'||entry.start+28>entry.end)reject();const esds=boxes(b,entry.start+28,entry.end).find(x=>x.type==='esds');if(!esds||esds.start+4>=esds.end)reject();const decoder=descriptor(b,esds.start+4,esds.end,4),specific=descriptor(b,esds.start+4,esds.end,5);if(!decoder||decoder[0]!==0x40||!specific||specific.length<2||(specific[0]>>3)!==2)reject();audio++;}
 }
 if(video!==1||audio!==1)reject();return {videoCodec:'h264',audioCodec:'aac-lc'};
}
