import * as T from 'three';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {box,ball,cylinder,label,scooter,autoRickshaw,helmet,stops as memoryStops} from './world.js';
import {coconutCart} from './coconut-cart.js';
import {realisticTrees} from './asset-details.js';
import {addNeighborhoodClutter} from './neighborhood-clutter.js';
import {createTraffic} from './traffic.js';
import {animeSurface,applyAnimeArt,addAnimeShopLighting} from './anime-art.js';

// A deliberately composed, fully 3D memory neighbourhood. Distances and the
// connecting street are artistic staging, not the couple's historical route.
const mat=(color,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
function ribbon(points,width,y){const verts=[],idx=[],uv=[];let distance=0;for(let i=0;i<points.length;i++){const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,nx=-dz/l*width/2,nz=dx/l*width/2;if(i)distance+=points[i].distanceTo(points[i-1]);verts.push(points[i].x+nx,y,points[i].z+nz,points[i].x-nx,y,points[i].z-nz);uv.push(0,distance/6,width/6,distance/6);if(i){const q=i*2;idx.push(q-2,q,q-1,q-1,q,q+1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function collision(list,x,z,w,d){list.push({polygon:[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]]});}
function sign(g,text,x,y,z,w,color='#365653'){const s=label(text,{width:640,height:128,font:40,background:color});s.position.set(x,y,z);s.scale.set(w,w*.2,1);g.add(s);return s;}
function pot(g,x,z,flowers=false){cylinder(g,.28,.2,.5,0xa3664d,x,.25,z);for(let i=0;i<5;i++)ball(g,.2,flowers?0xc75483:0x568143,x+Math.sin(i*2.4)*.2,.65+i*.05,z+Math.cos(i*2.4)*.2,[.8,1,.8]);}
function stall(world,x,z,name,color,type){const g=new T.Group();g.position.set(x,0,z);world.add(g);box(g,3.4,1.1,1.45,color,0,.61,0);for(let i=0;i<10;i++)box(g,.025,.85,.04,0xd5c199,-1.5+i*.34,.65,.75);box(g,3.6,.1,1.6,0xb38e5a,0,1.21,0);for(const a of [-1.6,1.6])cylinder(g,.035,.035,2.7,0x5d6658,a,1.4,-.4);for(let i=0;i<8;i++){const a=box(g,.5,.1,2.1,i%2?0xf3dfb3:color,-1.75+i*.5,2.65,0);a.rotation.x=.1;ball(g,.24,i%2?0xf3dfb3:color,-1.75+i*.5,2.45,1.04,[1,.35,.2]);}sign(g,name,0,2.05,.95,3);if(type==='momo'){cylinder(g,.61,.61,.15,0xa4b7b4,0,1.34,0);cylinder(g,.62,.62,.05,0xd6dfcb,0,1.44,0);for(let i=0;i<10;i++){const a=i*2.4;ball(g,.12,0xf5e4c2,Math.cos(a)*.4,1.52,Math.sin(a)*.4,[1,.7,.85]);}cylinder(g,.12,.1,.15,0x9c493b,.95,1.36,.2);}else for(let i=0;i<4;i++){cylinder(g,.14,.11,.52,0xe8a6b9,-.84+i*.56,1.52,0);ball(g,.15,0xffe2ad,-.84+i*.56,1.8,0,[1,.7,1]);const straw=cylinder(g,.012,.012,.42,0xe9e4bc,-.82+i*.56,1.92,0);straw.rotation.z=.12;}pot(g,-2,-.5);return g;}
function smallShop(world,x,z,color,name){const g=new T.Group();g.position.set(x,0,z);world.add(g);box(g,8,5.4,5,color,0,2.7,0);box(g,8.5,.24,5.6,0xe4d5b3,0,5.5,0);box(g,8.2,.3,5.2,0xb29573,0,.15,0);for(const a of [-2.7,2.7]){box(g,1.8,2.2,.08,0x557f82,a,2.6,2.55);box(g,2,.14,.3,0xf0dfb9,a,1.47,2.62);}box(g,1.5,2.7,.1,0x42594f,0,1.5,2.56);for(let i=0;i<8;i++){const m=box(g,1,.12,1.8,i%2?0xeee0be:0x6b9b8f,-3.5+i,3.5,3.1);m.rotation.x=.1;}sign(g,name,0,4.45,2.8,6);for(const a of [-3.6,3.6])pot(g,a,3.5,true);return g;}
export async function createCompactWorld(progress=()=>{}){
 const world=new T.Group();world.name='BUMO and SUMO — our Bangalore storybook';const collisions=[],markers=[],waters=[],cameraObstacles=[];
 const painted=new T.TextureLoader().load('assets/art-direction/painted-stucco-v1.png');painted.colorSpace=T.SRGBColorSpace;painted.wrapS=painted.wrapT=T.RepeatWrapping;painted.repeat.set(2,2);painted.anisotropy=8;
 function paintMaterials(g){g.traverse(m=>{if(!m.isMesh)return;const list=Array.isArray(m.material)?m.material:[m.material];for(const material of list){if(/stucco|ivory|paving/.test(material.name)){material.map=painted;material.bumpMap=painted;material.bumpScale=.015;material.needsUpdate=true;}}});}

 progress('Making a little Bangalore, just for you');
 const ground=new T.Mesh(new T.CylinderGeometry(87,90,2,96),animeSurface('earth',0xb8b294,12));ground.scale.z=.82;ground.position.y=-1.1;ground.receiveShadow=true;world.add(ground);
 const grass=new T.Mesh(new T.CircleGeometry(86,96),animeSurface('grass',0xffffff,28));grass.rotation.x=-Math.PI/2;grass.scale.y=.82;grass.position.y=-.07;grass.receiveShadow=true;world.add(grass);
 const controls=[[-49,-10],[-31,-17],[-5,-13],[24,-18],[45,-8],[49,14],[34,33],[7,37],[-20,35],[-46,22]];
 const curve=new T.CatmullRomCurve3(controls.map(([x,z])=>new T.Vector3(x,0,z)),true,'catmullrom',.25),roadPoints=curve.getPoints(220);
 for(const [w,y,c] of [[11.4,-.01,0xd8c5a0],[8.7,.035,0x737a73]]){const m=new T.Mesh(ribbon(roadPoints,w,y),animeSurface(w>10?'paving':'asphalt'));m.receiveShadow=true;world.add(m);}
 for(let i=0;i<roadPoints.length-1;i+=5){const a=roadPoints[i],b=roadPoints[i+1],m=box(world,.09,.015,1.5,0xe7d7b0,a.x,.057,a.z);m.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);}
 // Small footpaths connect the story stops to the street.
 for(const [a,b] of [[[-34,-10],[-35,-23]],[[33,-22],[33,-27]],[[-38,13],[-45,16]],[[45,20],[45,14]],[[-47,25],[-47,31]],[[0,39],[0,45]],[[30,36],[30,43]]]){const v=[new T.Vector3(a[0],0,a[1]),new T.Vector3(b[0],0,b[1])],m=new T.Mesh(ribbon(v,3,.025),animeSurface('paving'));m.receiveShadow=true;world.add(m);}
 progress('Bringing back your apartment and first day');
 const loader=new GLTFLoader();const [home,officeModel,restaurant]=await Promise.all(['naimisha-courtyard','grasim-office','waiwai-entrance'].map(async key=>(await loader.loadAsync('assets/architecture/'+key+'.glb')).scene));
 for(const g of [home,officeModel,restaurant])paintMaterials(g);
 for(const g of [home,officeModel,restaurant])g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
 home.position.set(-35,.05,-28);officeModel.position.set(33,.05,-32);restaurant.position.set(45,.05,12);world.add(home,officeModel,restaurant);cameraObstacles.push(home,officeModel,restaurant);
 // Home keeps the seven-floor block and ground-floor-only courtyard. Collisions
 // follow ground-level wings, leaving the right passage and central grass open.
 collision(collisions,-35,-28,10,7);collision(collisions,-27,-25,4,3);
 for(const [x,z] of [[-43,-40],[-30,-40],[-43,-53],[-30,-53]])collision(collisions,x,z,6,4);
 collision(collisions,-44.5,-46,3,10);collision(collisions,33,-33.15,12,7.9);collision(collisions,37,-27.85,3.9,3.15);collision(collisions,45,11,10,4);
 const cart=coconutCart();cart.position.set(-38,0,8.9);cart.rotation.y=.2;world.add(cart);cameraObstacles.push(cart);collision(collisions,-38,8.9,3.1,2.2);
 const momo=stall(world,-16,26,'MOMO TIME',0xb66e52,'momo'),falooda=stall(world,12,25,'FALOODA',0xb9778d,'falooda');for(const g of [momo,falooda]){cameraObstacles.push(g);collision(collisions,g.position.x,g.position.z,3.6,1.7);}
 const nails=smallShop(world,27,25,0xd3a9ae,'LITTLE DETAILS');cameraObstacles.push(nails);collision(collisions,27,25,8,5);
 // A little pool corner with tiles, ladders, and changing-room doorway.
 box(world,14,.18,10,0xdcd5ba,-52,.02,33);box(world,11,.15,7.5,0x588f9e,-52,.13,33);collision(collisions,-52,33,11,7.5);
 const water=new T.Mesh(new T.PlaneGeometry(10.7,7.2),new T.MeshPhysicalMaterial({color:0x58b9c2,roughness:.15,metalness:.1,transparent:true,opacity:.88}));water.rotation.x=-Math.PI/2;water.position.set(-52,.23,33);world.add(water);waters.push(water);
 for(let z=30.7;z<36;z+=1.6)box(world,10.5,.025,.045,0xc5eee1,-52,.245,z);
 for(const x of [-50.6,-49.9]){cylinder(world,.035,.035,1.2,0xc9d0bd,x,.7,28.8);ball(world,.06,0xc9d0bd,x,1.3,28.8);}
 sign(world,'LITTLE DOLPHIN CLUB',-52,2.3,27,7);pot(world,-59,28);pot(world,-45,38);
 const changing=smallShop(world,-61,44,0xa9c6bc,'SWIM');changing.scale.set(.7,.65,.7);cameraObstacles.push(changing);collision(collisions,-61,44,5.6,3.5);
 // Cinema and the stand-up detour are intimate playable sets.
 const cinema=smallShop(world,0,48,0x777b9c,'MOVIE NIGHT');cameraObstacles.push(cinema);collision(collisions,0,48,8,5);sign(cinema,'SPIDER-MAN',0,2.8,3.5,4,'#7a494f');for(let i=0;i<12;i++)ball(cinema,.065,0xffd995,-3.3+i*.6,3.65,4);
 const comedy=new T.Group();comedy.position.set(31,0,45);world.add(comedy);box(comedy,9,.35,5,0x967057,0,.18,0);box(comedy,9,4,.15,0x715c76,0,2.15,-2.4);for(const x of [-4,4])box(comedy,.65,4,.3,0xaa6879,x,2.15,-2.2);sign(comedy,'LAUGHING WITH YOU',0,3.1,-2.1,7);cylinder(comedy,.025,.025,1.45,0x414f4a,0,1.05,0);ball(comedy,.07,0x333d3d,0,1.8,0,[1,1.4,1]);for(const x of [-2.5,-.8,.8,2.5])for(const z of [3.5,5.1]){box(comedy,.65,.1,.65,0xbd9d6a,x,.45,z);box(comedy,.65,.6,.08,0xbd9d6a,x,.75,z+.3);}cameraObstacles.push(comedy);collision(collisions,31,42.6,9,.3);
 // Colourful side buildings define streets without overwhelming the characters.
 for(const [x,z,w,h,c] of [[-9,-31,7,7,0xd9bb8c],[8,-33,8,10,0x98bdb6],[-63,-9,7,6,0xc9aaa3],[-65,12,6,8,0xd1bf91],[64,-8,8,9,0xa8bec7],[62,25,7,7,0xd6a995],[-28,52,7,6,0xb8c59b]]){const g=new T.Group();g.position.set(x,0,z);world.add(g);box(g,w,h,6,c,0,h/2,0);box(g,w+.4,.2,6.4,0xe6d6b3,0,h+.1,0);for(let y=2;y<h;y+=2.6)for(let xx=-w/2+1.3;xx<w/2;xx+=2.3){box(g,1.3,1.55,.08,0x4f7375,xx,y,3.05);box(g,1.6,.12,.65,0xe5d9bf,xx,y-.85,3.25);box(g,1.6,.65,.035,0x65776e,xx,y-.5,3.55);}cylinder(g,.48,.48,.75,0x51645d,1,h+.6,0);collision(collisions,x,z,w,6);cameraObstacles.push(g);}
 // Warm lamps, flower pots and benches along the open walkways.
 for(const [x,z] of [[-43,-17],[-23,-10],[14,-20],[48,-19],[54,10],[37,38],[7,43],[-25,40],[-53,10]]){cylinder(world,.055,.075,4.1,0x59665b,x,2.05,z);ball(world,.23,0xffdf98,x,4.18,z,[.8,1.2,.8]);pot(world,x+1,z,true);}
 for(const [x,z] of [[-27,8],[18,14],[-32,28]]){box(world,2.6,.12,.7,0x9d8057,x,.56,z);box(world,2.6,.6,.1,0x9d8057,x,.92,z-.3);for(const xx of [x-1,x+1])box(world,.08,.5,.5,0x637167,xx,.25,z);}
 progress('Planting the tree-lined corners');const treeLocations=[];for(let i=0;i<26;i++){const a=i*Math.PI*2/26;treeLocations.push([Math.cos(a)*74,Math.sin(a)*59]);}treeLocations.push([-55,-21],[-19,-23],[19,-29],[54,-24],[56,37],[-34,42],[-57,17]);
 try{await realisticTrees(world,treeLocations);}catch(e){console.warn('Using sculpted trees while leaf asset loads',e);for(const [x,z] of treeLocations){cylinder(world,.16,.28,4.2,0x786b4f,x,2.1,z);for(let j=0;j<4;j++)ball(world,2,0x5f8252,x+Math.sin(j*2)*1.1,4.7+j*.55,z+Math.cos(j*2)*1.1,[1.1,.8,1]);}}
 addNeighborhoodClutter(world);
 // Layered garden and soil washes replace the single flat field between streets.
 for(const [x,z,rx,rz,kind] of [[-10,7,19,12,'grass'],[19,6,13,10,'earth'],[-29,19,10,8,'earth'],[6,20,15,7,'grass']]){const patch=new T.Mesh(new T.CircleGeometry(1,42),animeSurface(kind,kind==='grass'?0xc4d49e:0xd3c4a4,5));patch.rotation.x=-Math.PI/2;patch.scale.set(rx,rz,1);patch.position.set(x,-.025,z);patch.receiveShadow=true;world.add(patch);}
 const coords={home:[-34,-10],coconut:[-38,13],office:[33,-22],momos:[-16,31],nails:[27,32],falooda:[12,30],waiwai:[45,17],pool:[-47,25],comedy:[31,54],cinema:[0,55],auto:[-27,-10]};
 const stops=memoryStops.map(s=>({...s,x:coords[s.id][0],z:coords[s.id][1]}));
 for(const stop of stops){const pin=new T.Group();pin.position.set(stop.x,3.0,stop.z);const orb=new T.Mesh(new T.OctahedronGeometry(.2),new T.MeshStandardMaterial({color:0xffd58b,emissive:0xa86e28,emissiveIntensity:.35}));pin.add(orb);const title=label(stop.short,{width:512,height:100,font:36,background:'#35594e'});title.scale.set(2.4,.47,1);title.position.y=.55;pin.add(title);world.add(pin);const ring=new T.Mesh(new T.TorusGeometry(1,.035,8,40),new T.MeshBasicMaterial({color:0xf6ce7f}));ring.rotation.x=-Math.PI/2;ring.position.set(stop.x,.12,stop.z);world.add(ring);markers.push({stop,pin,orb,ring});}
 const bike=new T.Group();bike.name='Our yellow scooty';bike.add((await loader.loadAsync('assets/architecture/yellow-scooty.glb')).scene);bike.position.set(-30,.06,-7);bike.rotation.y=.35;world.add(bike);const parkedHelmet=helmet(bike,0,1.15,-.4);parkedHelmet.name='Parked green helmet';bike.userData.parkedHelmet=parkedHelmet;const auto=(await loader.loadAsync('assets/architecture/auto-rickshaw.glb')).scene;auto.position.set(-24,.12,-6);auto.rotation.y=-.3;world.add(auto);
 const route=roadPoints.map(p=>[p.x,p.z]),data={places:{home:[-35,-28],office:[33,-32],pool:[-52,33]},route,roads:[{id:'memory-loop',name:'Our little Bangalore',kind:'residential',width:8.7,points:route}],routeStatus:'Artistic storybook composition; not geographic navigation or the historical commute.',attribution:'Personal memory reconstruction'};
 applyAnimeArt(world);addAnimeShopLighting(world);
 const updateTraffic=createTraffic(world,data,{maxVehicles:12});const routeGlow=new T.Group();routeGlow.visible=false;
 return {world,data,collisions,markers,waters,home,officeModel,restaurant,bike,auto,stops,spawn:new T.Vector3(-34,.06,-10),homeExit:new T.Vector3(-30,.16,-7),updateTraffic,route,routeGlow,cameraObstacles,bounds:{minX:-72,maxX:72,minZ:-62,maxZ:62}};
}
