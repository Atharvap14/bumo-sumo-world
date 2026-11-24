import * as T from 'three';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {box,ball,cylinder,scooter,autoRickshaw} from './world.js';
// Static street furniture is merged by material, keeping detail affordable on phones.
export function dressStreets(world,data){
 const props=new T.Group();
 const wall=0xaaa797,rail=0x3d4b48;
 // Entrance forecourt, with a planted edge and an open approach from Bannerghatta Road.
 box(props,24,.12,32,0xa6a495,-68,-.02,4);
 for(const z of [-15,23]){
  box(props,24,.65,.35,wall,-64,.32,z);
  box(props,24,.09,.5,0xd0cab7,-64,.69,z);
  for(let x=-75;x<-52;x+=.8)cylinder(props,.025,.025,.8,rail,x,1.1,z);
  box(props,24,.04,.045,rail,-64,1.5,z);
  box(props,23,.14,1.5,0x586c3c,-64,.06,z+(z<0?1:-1));
  for(let i=0;i<28;i++){
   const x=-75+i*.82,zz=z+(z<0?1:-1);
   ball(props,.38,[0x426b35,0x567b39,0x6d873f][i%3],x,.4,zz,[1,.8,1]);
  }
 }
 // Gate pillars and an open pedestrian lane on the right.
 for(const z of [-13,21]){box(props,.65,1.5,.7,0x9e9b8b,-77,.75,z);box(props,.8,.1,.8,0xdad5c5,-77,1.55,z);}
 const parking=[];
 for(let i=5;i<data.route.length-2;i+=5){
  const a=data.route[i-1],b=data.route[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
  parking.push({x:b[0]-dz/len*6.4,z:b[1]+dx/len*6.4,angle:Math.atan2(dx,dz),i});
 }
 parking.push({x:-73,z:-8,angle:.1,i:1},{x:-73,z:-11,angle:.2,i:2});
 for(const p of parking){
  const g=p.i%3===0?autoRickshaw():scooter();
  if(p.i%3!==0)g.traverse(m=>{if(m.isMesh&&m.material.color?.getHex()===0xf4c443){m.material=m.material.clone();m.material.color.setHex([0x7d3232,0xd2d1c6,0x344c60,0x697171][p.i%4]);}});
  g.position.set(p.x,.1,p.z);g.rotation.y=p.angle+(p.i%3===0?0:.25);props.add(g);
 }
 // Manhole covers, curbside planters and utility cabinets break up the road edge.
 for(let i=7;i<data.route.length;i+=9){const p=data.route[i];const cover=cylinder(props,.45,.45,.025,0x4f5452,p[0]+2,.09,p[1]);for(let j=0;j<5;j++)box(props,.6,.015,.025,0x777b74,p[0]+2,.11,p[1]-.2+j*.1);}
 props.updateMatrixWorld(true);const batches=new Map();
 props.traverse(m=>{if(!m.isMesh||Array.isArray(m.material))return;const geo=m.geometry.clone().applyMatrix4(m.matrixWorld);const key=m.material.uuid;if(!batches.has(key))batches.set(key,{material:m.material,geometries:[]});batches.get(key).geometries.push(geo);});
 for(const {material,geometries} of batches.values()){const merged=mergeGeometries(geometries.map(g=>g.index?g.toNonIndexed():g));if(!merged)continue;const m=new T.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;world.add(m);for(const g of geometries)g.dispose();}
}
