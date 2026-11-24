import * as T from 'three';
const cache=new Map();
function rng(seed=815){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
/** Painted albedo layers, deliberately visible at the close 2.5D camera scale. */
export function paintedTexture(kind='plaster'){
 if(cache.has(kind))return cache.get(kind);
 const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d'),r=rng(kind.length*519+17);
 const schemes={plaster:['#fff0d8','#d7bed0'],asphalt:['#647586','#414e69'],paving:['#ead4b0','#a9b4ad'],grass:['#a7bb72','#477c70'],earth:['#bd9c73','#827e68'],brick:['#e8b38b','#a86469'],wood:['#d4b17b','#8c6970']};
 const colors=schemes[kind]||schemes.plaster,gradient=x.createLinearGradient(0,0,70,512);gradient.addColorStop(0,colors[0]);gradient.addColorStop(1,colors[1]);x.fillStyle=gradient;x.fillRect(0,0,512,512);
 // Broad translucent watercolor strokes leave pools of pigment and uneven edges.
 for(let i=0;i<160;i++){const px=r()*512,py=r()*512,w=20+r()*130,h=3+r()*28;x.globalAlpha=.035+r()*.07;x.fillStyle=i%3===0?'#fff5cf':i%3===1?'#697b93':'#ae7899';x.beginPath();x.ellipse(px,py,w,h,(r()-.5)*.25,0,Math.PI*2);x.fill();}
 x.globalAlpha=1;
 if(kind==='plaster'){for(let i=0;i<80;i++){const px=r()*512,py=r()*512;x.strokeStyle=i%2?'rgba(107,100,125,.14)':'rgba(255,248,220,.3)';x.lineWidth=.7+r()*1.8;x.beginPath();x.moveTo(px,py);x.lineTo(px+(r()-.5)*10,py+15+r()*70);x.stroke();}}
 if(kind==='asphalt'){for(let i=0;i<12;i++){let px=r()*512,py=r()*512;x.strokeStyle='rgba(35,43,65,.4)';x.lineWidth=.7;x.beginPath();x.moveTo(px,py);for(let j=0;j<6;j++){px+=(r()-.5)*30;py+=r()*25;x.lineTo(px,py);}x.stroke();}for(let i=0;i<1600;i++){x.fillStyle=i%3?'rgba(206,210,207,.2)':'rgba(27,40,66,.25)';x.fillRect(r()*512,r()*512,1+r()*2,.7+r());}}
 if(kind==='grass'){for(let i=0;i<2200;i++){const px=r()*512,py=r()*512;x.strokeStyle=['rgba(215,218,128,.38)','rgba(46,112,92,.48)','rgba(112,151,105,.5)'][i%3];x.lineWidth=1+r()*2;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+(r()-.5)*8,py-5,px+(r()-.5)*12,py-7-r()*9);x.stroke();}}
 if(kind==='paving'||kind==='brick'){const rowH=kind==='brick'?48:128,colW=kind==='brick'?116:128;for(let row=0;row<512/rowH;row++)for(let col=-1;col<512/colW+1;col++){const px=col*colW+(row%2)*colW/2,py=row*rowH;x.strokeStyle='rgba(66,76,87,.28)';x.lineWidth=3;x.strokeRect(px+2,py+2,colW-5,rowH-5);x.strokeStyle='rgba(255,239,197,.45)';x.lineWidth=2;x.beginPath();x.moveTo(px+5,py+rowH-6);x.lineTo(px+5,py+5);x.lineTo(px+colW-6,py+5);x.stroke();}}
 if(kind==='wood'){for(let i=0;i<70;i++){const y=r()*512;x.strokeStyle=i%3?'rgba(96,66,62,.24)':'rgba(255,218,146,.35)';x.lineWidth=.5+r()*2;x.beginPath();x.moveTo(0,y);for(let j=0;j<9;j++)x.lineTo(j*64,y+Math.sin(j*.8+i)*5);x.stroke();}}
 for(let i=0;i<2600;i++){x.fillStyle=i%2?'rgba(255,244,215,.08)':'rgba(45,54,75,.06)';x.fillRect(r()*512,r()*512,1+r()*2,1+r()*2);}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;cache.set(kind,tex);return tex;
}
export function animeSurface(kind,color=0xffffff,repeat=1){const tex=paintedTexture(kind).clone();tex.repeat.set(repeat,repeat);tex.needsUpdate=true;return new T.MeshStandardMaterial({color,map:tex,bumpMap:tex,bumpScale:kind==='asphalt'?.035:.018,roughness:.94,metalness:0});}
export function createAnimeSky(mood='morning'){
 const key='sky-'+mood;if(cache.has(key))return cache.get(key);
 const c=document.createElement('canvas');c.width=2048;c.height=1024;const ctx=c.getContext('2d'),r=rng(744),evening=mood==='evening';
 const grad=ctx.createLinearGradient(0,0,0,1024);for(const [p,col] of evening?[[0,'#34447d'],[.28,'#8e73ad'],[.48,'#e3a4a4'],[.56,'#f5c892'],[1,'#b8b3c5']]:[[0,'#397eae'],[.27,'#75bed1'],[.46,'#c3dce0'],[.55,'#f5d9bb'],[1,'#c1d4c9']])grad.addColorStop(p,col);ctx.fillStyle=grad;ctx.fillRect(0,0,2048,1024);
 // Layered painted cloud banks, with lilac undersides and luminous creamy rims.
 for(let i=0;i<32;i++){const px=r()*2048,py=100+r()*350,w=55+r()*165,h=12+r()*30;for(let j=0;j<7;j++){const xx=px+(j-3)*w*.17,yy=py-Math.sin(j*.7)*h*.45;ctx.globalAlpha=.55;ctx.fillStyle=evening?'#a58aa9':'#b1c8dc';ctx.beginPath();ctx.ellipse(xx,yy+h*.25,w*.34,h*.72,0,0,6.29);ctx.fill();ctx.globalAlpha=.76;ctx.fillStyle=evening?'#ffd9bc':'#fff4d9';ctx.beginPath();ctx.ellipse(xx-4,yy-5,w*.33,h*.67,0,0,6.29);ctx.fill();}}
 ctx.globalAlpha=1;const sun=ctx.createRadialGradient(1510,330,0,1510,330,115);sun.addColorStop(0,'rgba(255,247,195,.95)');sun.addColorStop(.18,'rgba(255,239,179,.85)');sun.addColorStop(1,'rgba(255,220,150,0)');ctx.fillStyle=sun;ctx.fillRect(1390,210,240,240);
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;cache.set(key,texture);return texture;
}
function paintShader(material,amount=.12){
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vAnimePaintPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAnimePaintPosition = position;');
  shader.fragmentShader='varying vec3 vAnimePaintPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float brush = sin(vAnimePaintPosition.x * 4.7 + sin(vAnimePaintPosition.y * 6.1)) * sin(vAnimePaintPosition.z * 5.3 + vAnimePaintPosition.y * 2.8);
   diffuseColor.rgb *= 1.0 + brush * ${amount.toFixed(3)};
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   float animeLuma = dot(outgoingLight, vec3(.2126,.7152,.0722));
   float warmLight = smoothstep(.16,.72,animeLuma);
   vec3 coolShadow = outgoingLight * vec3(.84,.89,1.14) + vec3(.012,.004,.025);
   vec3 sunnyPaint = outgoingLight * vec3(1.055,1.015,.95);
   outgoingLight = mix(coolShadow,sunnyPaint,warmLight);
   #include <opaque_fragment>
  `);
 };
 material.customProgramCacheKey=()=>`anime-painted-light-v3-${amount}`;material.needsUpdate=true;
}
export function applyAnimeArt(world){
 const converted=new Map(),windowColors=new Set([0x557f82,0x4f7375,0x45615f,0x557f82]);
 world.traverse(mesh=>{if(!mesh.isMesh)return;const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];const next=list.map(source=>{
  if(!source?.isMeshStandardMaterial||source.transparent&&source.opacity<.8)return source;
  if(converted.has(source))return converted.get(source);const m=source.clone();converted.set(source,m);
  const n=m.name.toLowerCase(),color=source.color.getHex();
  if(/stucco|ivory|plaster/.test(n)){m.map=paintedTexture('plaster');m.bumpMap=m.map;m.bumpScale=.018;}
  else if(/terracotta.*tile/.test(n)){m.map=paintedTexture('brick');m.bumpMap=m.map;m.bumpScale=.025;}
  else if(!m.map&&m.metalness<.3&&mesh.geometry.type==='BoxGeometry'){m.map=paintedTexture('plaster');m.bumpMap=m.map;m.bumpScale=.012;}
  if(windowColors.has(color)||n==='window_glass'){m.emissive=new T.Color(0xe69c53);m.emissiveIntensity=.16;m.userData.animeWindow=true;}
  const hsl={};m.color.getHSL(hsl);if(hsl.s>.12&&hsl.l>.09)m.color.setHSL(hsl.h,Math.min(.86,hsl.s*1.15),Math.min(.82,hsl.l*1.015));
  paintShader(m,m.metalness>.45?.015:m.map?.06:.12);return m;
 });mesh.material=Array.isArray(mesh.material)?next:next[0];
  const dimensions=mesh.geometry.parameters;
  if(mesh.geometry.type==='BoxGeometry'&&dimensions.width>4&&dimensions.height>3&&!mesh.userData.animeInk){const lines=new T.LineSegments(new T.EdgesGeometry(mesh.geometry,35),new T.LineBasicMaterial({color:0x464b67,transparent:true,opacity:.3}));lines.name='Fine illustrated building edge';mesh.add(lines);mesh.userData.animeInk=true;}
 });
 world.userData.artDirection='Painted anime backgrounds with warm sun, lilac shadows, layered albedo, and original 3D characters.';
 return world;
}
export function setAnimeMood(scene,mood){const evening=mood==='evening';scene.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.userData?.animeWindow)m.emissiveIntensity=evening?.85:.16;}if(o.isPointLight&&o.userData.animeShop)o.intensity=evening?o.userData.nightPower:o.userData.dayPower;});}
export function addAnimeShopLighting(world){
 const group=new T.Group();group.name='Luminous shop windows and warm lantern pools';
 for(const [x,z,color] of [[-16,27,0xffb86b],[12,26,0xffa6a1],[45,14,0xffc978],[27,28,0xf7b2cd],[0,51,0xffb27e]]){const l=new T.PointLight(color,5,9,2);l.position.set(x,2.2,z);l.userData={animeShop:true,dayPower:5,nightPower:22};group.add(l);}
 world.add(group);return group;
}
