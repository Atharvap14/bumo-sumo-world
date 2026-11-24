import * as T from 'three';
import {vehicleCapsule,capsuleBlocked,sweptVehicleClear} from './traffic-safety.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {box,ball,cylinder,scooter,autoRickshaw} from './world.js';

// Ambient traffic with body clearance and pedestrian yielding. Roads come from the map; left-side
// lanes, queues and density are inferred. No audio or network requests here.
function profile(points,width){const sh=new T.Shape();points.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:width,bevelEnabled:true,bevelThickness:.07,bevelSize:.07,bevelSegments:2,steps:1});g.translate(0,0,-width/2);g.rotateY(-Math.PI/2);return g;}
function car(){const g=new T.Group(),paint=new T.MeshStandardMaterial({color:0xffffff,roughness:.27,metalness:.3});paint.name='traffic-paint';const body=new T.Mesh(profile([[-2,.4],[-2,.75],[-1.7,.95],[-1.05,1.02],[-.65,1.48],[.62,1.48],[1.25,.99],[1.85,.88],[2,.65],[1.9,.4]],1.65),paint);g.add(body);
for(const x of [-.84,.84]){const a=box(g,.025,.38,.94,0x314750,x,1.23,-.15);a.rotation.x=-.02;box(g,.032,.045,.95,0x9ca4a3,x,1.46,-.15);box(g,.035,.5,.045,0x273132,x,1.22,-.15);box(g,.035,.045,.17,0xc0c4ba,x,.95,-.5);}
let w=box(g,1.45,.44,.035,0x314750,0,1.24,.94);w.rotation.x=.68;w=box(g,1.4,.36,.035,0x314750,0,1.25,-.86);w.rotation.x=-.68;
for(const x of [-.87,.87])for(const z of [-1.3,1.25]){let m=cylinder(g,.31,.31,.18,0x242929,x,.39,z);m.rotation.z=Math.PI/2;m=cylinder(g,.17,.17,.19,0xadb5b6,x,.39,z);m.rotation.z=Math.PI/2;}
for(const x of [-.58,.58]){box(g,.37,.17,.04,0xffe4ad,x,.8,1.96);box(g,.35,.16,.04,0xb63732,x,.76,-1.98);ball(g,.11,0x434d50,x*1.58,1.14,.55,[1.2,.7,.6]);}box(g,.8,.13,.045,0x272e31,0,.56,2.02);box(g,.38,.11,.045,0xe8d79b,0,.56,-2.03);return g;}
function bus(){const g=new T.Group();box(g,2.3,1.35,8.2,0xc5e0d6,0,1.23,0);ball(g,1,0xe3ebe4,0,2.13,0,[1.16,.67,4.1]);box(g,2.25,.28,8.2,0x398c8d,0,.8,0);box(g,2.15,1.03,.08,0x27454e,0,2.04,4.05);box(g,2.17,.37,.08,0xc2d7cf,0,1.32,4.08);
for(const x of [-1.17,1.17])for(let z=-3.3;z<3.6;z+=.95){box(g,.03,.84,.83,0x27454e,x,2.08,z);box(g,.035,.04,.85,0xb1bcbb,x,2.52,z);}
for(const x of [-1.18,1.18])for(const z of [-2.7,2.55]){let m=cylinder(g,.47,.47,.22,0x20272a,x,.55,z);m.rotation.z=Math.PI/2;m=cylinder(g,.24,.24,.24,0x8d9b9f,x,.55,z);m.rotation.z=Math.PI/2;}
for(const x of [-.83,.83])box(g,.32,.17,.06,0xffe5b2,x,1,4.15);box(g,1.6,.23,.06,0x32464b,0,2.68,3.95);return g;}
function commuter(){const g=scooter();g.scale.setScalar(.88);ball(g,.22,0x454756,0,1.95,-.05,[.9,1.05,.95]);ball(g,.3,0x7c9cbe,0,1.47,-.14,[.85,1.3,.6]);for(const x of [-.21,.21]){const arm=cylinder(g,.06,.06,.45,0x7c9cbe,x,1.58,.22);arm.rotation.x=.8;const leg=cylinder(g,.09,.09,.55,0x3d4652,x,1.03,.03);leg.rotation.x=.45;}return g;}
function auto(){const g=autoRickshaw();ball(g,.2,0x5f5348,0,1.64,.52,[.8,1,.9]);box(g,.44,.45,.3,0xb7a986,0,1.25,.5);return g;}
function makePath(points,width){const p=points.filter((v,i)=>!i||Math.hypot(v[0]-points[i-1][0],v[1]-points[i-1][1])>.1),cum=[0];for(let i=1;i<p.length;i++)cum.push(cum.at(-1)+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return {p,cum,length:cum.at(-1),width};}
function sample(path,s){s=Math.max(0,Math.min(path.length-.001,s));let i=1;while(i<path.cum.length-1&&path.cum[i]<s)i++;const a=path.p[i-1],b=path.p[i],length=path.cum[i]-path.cum[i-1],t=(s-path.cum[i-1])/length;return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/length,dz:(b[1]-a[1])/length};}
function nearest(path,anchor){let best={d:Infinity,s:0};for(let i=1;i<path.p.length;i++){const a=path.p[i-1],b=path.p[i],dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((anchor[0]-a[0])*dx+(anchor[1]-a[1])*dz)/l));const d=Math.hypot(anchor[0]-a[0]-t*dx,anchor[1]-a[1]-t*dz);if(d<best.d)best={d,s:path.cum[i-1]+Math.sqrt(l)*t};}return best;}
function crop(path,s){const lo=Math.max(0,s-180),hi=Math.min(path.length,s+180),a=sample(path,lo),b=sample(path,hi),points=[[a.x,a.z]];path.p.forEach((p,i)=>{if(path.cum[i]>lo&&path.cum[i]<hi)points.push(p);});points.push([b.x,b.z]);return makePath(points,path.width);}
function batches(template,count,world){template.updateMatrixWorld(true);const grouped=new Map();template.traverse(o=>{if(!o.isMesh)return;const mat=o.material,key=mat.name==='traffic-paint'?'paint':`${mat.color.getHex()}-${mat.roughness}-${mat.metalness}`;let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();if(!grouped.has(key))grouped.set(key,{geos:[],material:mat,paint:key==='paint'});grouped.get(key).geos.push(g);});const result=[];for(const {geos,material,paint} of grouped.values()){const geom=mergeGeometries(geos,false),m=new T.InstancedMesh(geom,material,count);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;world.add(m);result.push({mesh:m,paint});geos.forEach(g=>g.dispose());}return result;}
export function createTraffic(world,data,options={}){
const group=new T.Group();group.name='Bangalore moving traffic';world.add(group);
const office=data.places.office,anchors=[[-70,20],office],paths=[],seen=new Set();
for(const anchor of anchors){const candidates=data.roads.filter(r=>r.width>=6&&!['footway','path','steps','construction','proposed','service'].includes(r.kind)&&r.points.length>1).map(r=>{const path=makePath(r.points,r.width);return {r,path,near:nearest(path,anchor)};}).filter(c=>c.path.length>100&&c.near.d<260).sort((a,b)=>a.near.d-b.near.d);
let added=0;for(const c of candidates){const key=c.r.name||String(c.r.id);if(seen.has(key))continue;seen.add(key);paths.push(crop(c.path,c.near.s));if(++added>=3)break;}}
// Ambient main-road stretches between the two geographic anchors; not a commute claim.
for(const f of [.36,.67]){const anchor=[-70+(office[0]+70)*f,20+(office[1]-20)*f];let best;for(const r of data.roads){if(r.width<8||r.points.length<2)continue;const path=makePath(r.points,r.width);if(path.length<130)continue;const n=nearest(path,anchor);if(!best||n.d<best.n.d)best={path,n};}if(best&&best.n.d<80)paths.push(crop(best.path,best.n.s));}
const fleets={car:[],auto:[],scooter:[],bus:[]},lanes=[];let serial=0;
for(const [pi,path] of paths.entries())for(const dir of [1,-1]){const count=Math.min(6,Math.max(3,Math.floor(path.length/27))),lane={path,dir,offset:0,speed:pi<6?2.4:3.5,phase:pi*2.7+(dir===1?0:9)};lanes.push(lane);for(let j=0;j<count;j++){if(serial>=(options.maxVehicles??Infinity))continue;const kind=path.width>=11&&j===1&&pi%3===1&&dir===1?'bus':serial%5===0?'scooter':serial%3===0?'auto':'car';fleets[kind].push({lane,start:(j+.35)*path.length/count,color:[0xe8e6d9,0x7b8b91,0x334c67,0xc0b6a6,0x9a4440,0xd0d6d4][serial%6],serial:serial++});}}
const sources={car:car(),auto:auto(),scooter:commuter(),bus:bus()},render={};for(const kind of Object.keys(fleets)){render[kind]=batches(sources[kind],fleets[kind].length,group);fleets[kind].forEach((v,i)=>render[kind].filter(b=>b.paint).forEach(b=>b.mesh.setColorAt(i,new T.Color(v.color))));}
const extents={};for(const [kind,source] of Object.entries(sources)){source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source);extents[kind]={minZ:box.min.z,maxZ:box.max.z,radius:Math.max(Math.abs(box.min.x),Math.abs(box.max.x))};}
const vehicles=Object.entries(fleets).flatMap(([kind,fleet])=>fleet.map(v=>Object.assign(v,{kind,distance:v.start,speed:0})));
function positionAt(v,distance){const {path,dir}=v.lane,s=((distance%path.length)+path.length)%path.length,at=sample(path,dir===1?s:path.length-s),dx=at.dx*dir,dz=at.dz*dir,off=Math.min(path.width*.24,path.width/2-(v.kind==='bus'?1.6:1.2));return {x:at.x+dz*off,z:at.z-dx*off,dx,dz,s};}
function bodyOf(v,distance=v.distance){return vehicleCapsule(positionAt(v,distance),extents[v.kind]);}
let reserved=[],elapsed=0;
const dummy=new T.Object3D();
function update(dt,focus,obstacles=[]){
 dt=Math.min(.1,Math.max(0,dt||0));elapsed+=dt;const protectedSpace=[...reserved,...obstacles];
 for(const v of vehicles){
  const cycle=(elapsed+v.lane.phase)%34,pace=cycle<6?.12:cycle<10?.12+(cycle-6)*.22:cycle>30?(34-cycle)*.25:1;
  const otherBodies=vehicles.filter(o=>o!==v&&!o.hidden).map(o=>bodyOf(o));
  const blockers=[...protectedSpace,...otherBodies];
  // Braking lookahead plus a swept-body guard prevents tunnelling at low FPS.
  const lookahead=1.4+v.speed*v.speed/4,canProceed=sweptVehicleClear(d=>positionAt(v,d),v.distance,v.distance+lookahead,extents[v.kind],blockers);
  const target=canProceed?v.lane.speed*pace:0;v.speed=T.MathUtils.clamp(target,v.speed-3.5*dt,v.speed+1.4*dt);
  const next=v.distance+v.speed*dt;
  if(sweptVehicleClear(d=>positionAt(v,d),v.distance,next,extents[v.kind],blockers))v.distance=next;else v.speed=0;
  // New chapters reserve their entrances under the opaque page-turn transition.
  // Any car already occupying that entrance is relocated there, never over a hero.
  v.hidden=capsuleBlocked(bodyOf(v),protectedSpace);
 }
 for(const [kind,fleet] of Object.entries(fleets)){fleet.forEach((v,i)=>{const at=positionAt(v,v.distance),path=v.lane.path;let scale=Math.min(1,at.s/10,(path.length-at.s)/10);if(v.hidden||(focus&&Math.hypot(at.x-focus.x,at.z-focus.z)>850))scale=0;dummy.position.set(at.x,.09,at.z);dummy.rotation.set(0,Math.atan2(at.dx,at.dz),0);dummy.scale.setScalar(Math.max(0,scale));dummy.updateMatrix();for(const b of render[kind])b.mesh.setMatrixAt(i,dummy.matrix);});for(const b of render[kind])b.mesh.instanceMatrix.needsUpdate=true;}
}
update.reserve=(obstacles,{relocate=false}={})=>{
 reserved=obstacles;
 if(relocate)for(const v of vehicles){if(!capsuleBlocked(bodyOf(v),reserved))continue;const otherBodies=vehicles.filter(o=>o!==v&&!o.hidden).map(o=>bodyOf(o));let found=false;
  for(let d=8;d<v.lane.path.length-8;d+=3){if(!capsuleBlocked(bodyOf(v,d),[...reserved,...otherBodies],.6)){v.distance=d;v.speed=0;v.hidden=false;found=true;break;}}
  if(!found){v.hidden=true;v.speed=0;}
 }
};
update.isClear=obstacles=>vehicles.every(v=>v.hidden||!capsuleBlocked(bodyOf(v),obstacles));
update.snapshot=()=>vehicles.map(v=>({kind:v.kind,speed:v.speed,hidden:!!v.hidden,...bodyOf(v)}));
update(0,null);update.totalVehicles=serial;update.group=group;update.dispose=()=>{group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});group.removeFromParent();};group.userData={vehicleCount:serial,interpretation:'Illustrative slow traffic; inferred left-side lanes and queue timing, not live traffic or surveyed lane markings.'};return update;
}
