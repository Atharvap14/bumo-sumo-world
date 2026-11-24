import * as T from 'three';

// A real miniature street for the title/welcome shot. Original game assets and
// materials are shared read-only; everything animated here belongs to this set.
export function createTitleSet(stage,n){
 const root=new T.Group();root.name='Our little universe · title street';stage.add(root);
 const ownedGeometry=new Set(),ownedMaterial=new Set(),ownedTexture=new Set();
 const geometry=g=>(ownedGeometry.add(g),g),material=m=>(ownedMaterial.add(m),m);
 const standard=(color,extra={})=>material(new T.MeshStandardMaterial({color,roughness:.85,...extra}));
 const add=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;};
 const cube=(w,h,d,m,x,y,z)=>add(geometry(new T.BoxGeometry(w,h,d)),m,x,y,z);
 const navy=standard(0x242c47),stone=standard(0x597184),terracotta=standard(0xae5f70),brass=standard(0xcba865,{metalness:.45,roughness:.36}),leaf=standard(0x267c72),pink=standard(0xdb698a),wire=standard(0x252b3a);
 const warm=standard(0xffd792,{emissive:0xffbc65,emissiveIntensity:2.1});
 const teal=standard(0x6fe5d9,{emissive:0x41c6c1,emissiveIntensity:1.1});
 const rosy=standard(0xf7b5cf,{emissive:0xda709e,emissiveIntensity:1.3});
 // Broad slate pavement with tiny terrazzo specks, rather than a display plinth.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#647184';ctx.fillRect(0,0,512,512);let seed=8731;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<3200;i++){ctx.fillStyle=['#74838f','#536477','#87929a','#b3a7a1'][i%4];ctx.globalAlpha=.2+random()*.35;const x=random()*512,y=random()*512;ctx.fillRect(x,y,1+random()*3,1+random()*2);}ctx.globalAlpha=1;
 const pavementTexture=new T.CanvasTexture(canvas);pavementTexture.colorSpace=T.SRGBColorSpace;pavementTexture.wrapS=pavementTexture.wrapT=T.RepeatWrapping;pavementTexture.repeat.set(7,5);ownedTexture.add(pavementTexture);
 const pavement=standard(0xa9b7c5,{map:pavementTexture,roughness:.79});cube(26,.16,19,pavement,0,-.1,-2.4);
 // Brick seams and inlaid border catch the warm practical lights.
 const tiles=new T.InstancedMesh(geometry(new T.BoxGeometry(.72,.035,.37)),stone,96),dummy=new T.Object3D();
 for(let i=0;i<96;i++){const row=Math.floor(i/24),col=i%24;dummy.position.set(-8.5+col*.75+(row%2)*.375,-.005,-1.7-row*.4);dummy.updateMatrix();tiles.setMatrixAt(i,dummy.matrix);tiles.setColorAt(i,new T.Color([0x668086,0x747d92,0x938f9c,0x56777a][i%4]));}tiles.receiveShadow=true;root.add(tiles);
 for(const z of [-3.5,2.7])cube(24,.035,.06,brass,0,.005,z);
 // The photographed mint doorway and bougainvillea become the central backdrop.
 const restaurant=n.restaurant.clone(true);restaurant.name='Title · Nepali restaurant';restaurant.position.set(0,0,-5);restaurant.rotation.set(0,0,0);restaurant.scale.setScalar(.65);restaurant.visible=true;root.add(restaurant);
 const bike=n.bike.clone(true);bike.name='Title · our yellow scooty';bike.position.set(3.35,.02,.35);bike.rotation.set(0,-.67,0);bike.scale.setScalar(.94);bike.visible=true;root.add(bike);
 // Frame the street on the outside, leaving the full hero silhouettes open.
 cube(3.9,2.3,.24,navy,-5.5,1.15,-4.5);cube(3.9,.13,.38,terracotta,-5.5,2.32,-4.5);
 cube(3.3,2.6,.24,navy,5.3,1.3,-4.5);cube(3.3,.13,.38,terracotta,5.3,2.62,-4.5);
 const leafGeo=geometry(new T.SphereGeometry(1,8,6)),potGeo=geometry(new T.CylinderGeometry(.31,.23,.62,16));
 for(const [x,z,height] of [[-3.7,-2.1,1.25],[4.8,-2.5,1.8],[5.8,-3.4,1.5],[-5.1,-3.5,1.7]]){
  add(potGeo,terracotta,x,.31,z);for(let j=0;j<9;j++){const a=j*2.4,r=.16+Math.floor(j/3)*.12,o=add(leafGeo,j%4===0?pink:leaf,x+Math.cos(a)*r,.7+height*(.3+(j%4)*.16),z+Math.sin(a)*r);o.scale.set(.12,.42,.15);o.rotation.set(Math.sin(a)*.55,0,Math.cos(a)*.65);}
 }
 // Two scalloped strings: visible bulbs, actual wires, no foreground overlays.
 const bulbs=[];
 for(let row=0;row<2;row++){
  const points=[];for(let i=0;i<=36;i++){const u=i/36;points.push(new T.Vector3(-7+14*u,4.05-row*.6-Math.sin(Math.PI*u)*.65,-3.1-row*1.05));}
  const curve=new T.CatmullRomCurve3(points);add(geometry(new T.TubeGeometry(curve,60,.012,5,false)),wire);
  for(let i=0;i<19;i++){const p=curve.getPoint((i+.5)/19),bulb=add(geometry(new T.SphereGeometry(.052,8,6)),i%6===0?rosy:warm,p.x,p.y-.09,p.z);bulb.scale.y=1.35;bulbs.push(bulb);}
 }
 // Paper lanterns make the entrance feel like an evening worth remembering.
 for(const [x,y,z,c] of [[-2.4,2.5,-3.6,warm],[2.3,2.8,-3.7,rosy],[4.7,3.1,-3.8,teal]]){
  const lantern=add(geometry(new T.SphereGeometry(.25,20,14)),c,x,y,z);lantern.scale.set(1,1.3,1);
  for(const d of [-.28,.28])add(geometry(new T.CylinderGeometry(.1,.1,.05,16)),brass,x,y+d,z);
  for(let j=0;j<5;j++){const ring=add(geometry(new T.TorusGeometry(.225*Math.sqrt(1-((j-2)/3)**2),.008,4,24)),brass,x,y+(j-2)*.105,z);ring.rotation.x=Math.PI/2;}
 }
 const lights=[];for(const [color,intensity,x,y,z,distance] of [[0xffc690,11,-2,3.2,-1.8,10],[0xff85bb,7,3.2,2.7,-2.5,9],[0x60d9dc,7,4.5,2.6,1.2,9]]){const light=new T.PointLight(color,intensity,distance,2);light.position.set(x,y,z);root.add(light);lights.push(light);}
 // Handful of small luminous fireflies behind the characters, animated in place.
 const fireCanvas=document.createElement('canvas');fireCanvas.width=fireCanvas.height=32;const fc=fireCanvas.getContext('2d'),gradient=fc.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'rgba(255,245,197,1)');gradient.addColorStop(.22,'rgba(255,211,125,.85)');gradient.addColorStop(1,'rgba(255,211,125,0)');fc.fillStyle=gradient;fc.fillRect(0,0,32,32);
 const fireTexture=new T.CanvasTexture(fireCanvas);ownedTexture.add(fireTexture);
 const positions=new Float32Array(26*3),origins=[];for(let i=0;i<26;i++){const p=[-5.5+random()*12,.5+random()*3.6,-3.5+random()*2.3];origins.push(p);positions.set(p,i*3);}
 const fireGeo=geometry(new T.BufferGeometry());fireGeo.setAttribute('position',new T.BufferAttribute(positions,3));const fireMaterial=material(new T.PointsMaterial({map:fireTexture,color:0xffdca1,size:.09,transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending}));const fireflies=new T.Points(fireGeo,fireMaterial);fireflies.frustumCulled=false;root.add(fireflies);
 return {root,update(time){if(!root.visible)return;for(let i=0;i<origins.length;i++){const p=origins[i];positions[i*3]=p[0]+Math.sin(time*.22+i*2.7)*.15;positions[i*3+1]=p[1]+Math.sin(time*.37+i*1.7)*.12;positions[i*3+2]=p[2]+Math.cos(time*.19+i)*.1;}fireGeo.attributes.position.needsUpdate=true;fireMaterial.opacity=.58+Math.sin(time*.65)*.07;lights[1].intensity=7+Math.sin(time*.31)*.2;},dispose(){root.removeFromParent();for(const g of ownedGeometry)g.dispose();for(const m of ownedMaterial)m.dispose();for(const t of ownedTexture)t.dispose();}};
}
