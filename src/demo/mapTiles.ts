import mapData from './map-data.json';
const features=mapData.map(f=>({...f, minX:Math.min(...f.points.map(p=>p[0])),maxX:Math.max(...f.points.map(p=>p[0])), minY:Math.min(...f.points.map(p=>p[1])),maxY:Math.max(...f.points.map(p=>p[1]))}));
const cache=new Map<string,string>();
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function localTiles(x:number,y:number,z:number) {
 const key=`${x}/${y}/${z}`; if(cache.has(key))return cache.get(key)!;
 const scale=2**z, left=x*256, top=y*256;
 const fs=features.filter(f=>f.maxX*scale>=left-60 && f.minX*scale<=left+316 && f.maxY*scale>=top-60 && f.minY*scale<=top+316);
 const path=(f:typeof features[number])=>f.points.map((p,i)=>`${i?'L':'M'}${(p[0]*scale-left).toFixed(1)},${(p[1]*scale-top).toFixed(1)}`).join(' ');
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#f5f8f9"/>';
 for(const f of fs.filter(f=>f.kind!=='road')) svg+=`<path d="${path(f)}Z" fill="${f.kind==='park'?'#cef0bb':'#e5eaed'}" stroke="${f.kind==='park'?'#bee5aa':'#dfe6e9'}" stroke-width=".6"/>`;
 const roads=fs.filter(f=>f.kind==='road');
 const width=(f:typeof features[number])=>['primary','secondary','trunk'].includes(f.type)?Math.max(5,2**(z-14)*1.3):['footway','steps','path','service'].includes(f.type)?Math.max(1.4,2**(z-16)*1.8):Math.max(3,2**(z-14)*.85);
 for(const f of roads) svg+=`<path d="${path(f)}" fill="none" stroke="#dbe4e8" stroke-width="${width(f)+1.7}" stroke-linejoin="round"/>`;
 for(const f of roads) svg+=`<path d="${path(f)}" fill="none" stroke="${['primary','secondary'].includes(f.type)?'#fffdf4':'#ffffff'}" stroke-width="${width(f)}" stroke-linejoin="round"/>`;
 if(z>=16) { const seen=new Set<string>();for(const f of roads) { if(!f.name || f.name.length>30 || seen.has(f.name) || ['footway','steps','service'].includes(f.type))continue;
  const a=f.points[0],b=f.points[f.points.length-1]; if(Math.hypot(b[0]-a[0],b[1]-a[1])*scale<110)continue;
  seen.add(f.name);const px=(a[0]+b[0])/2*scale-left,py=(a[1]+b[1])/2*scale-top; let angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI; if(angle>90||angle< -90)angle+=180;
  svg+=`<text transform="translate(${px},${py}) rotate(${angle})" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#9aaab2" paint-order="stroke" stroke="#ffffff" stroke-width="2">${escape(f.name)}</text>`;
 }}
 svg+='</svg>'; const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);cache.set(key,url);if(cache.size>160)cache.delete(cache.keys().next().value!);return url;
}
