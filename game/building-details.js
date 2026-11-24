import * as T from 'three';

// Architectural interpretation of Bangalore residential streets. Footprints
// remain mapped; these facade details are not surveyed building elevations.
export function detailedBuildingEdges(world,buildings,office){
 const group=new T.Group();group.name='Bangalore balconies, parapets and street facades';
 const batches=new Map(),dummy=new T.Object3D();
 const palette={cream:0xe5d9bf,stone:0xa9a9a0,rose:0xb9836c,terracotta:0x9f5846,teal:0x4f7775,metal:0x35484a,silver:0x939b9c,shutter:0x687d7c,pipe:0xc8c7ba,dark:0x39464a};
 const boxGeo=new T.BoxGeometry(1,1,1),cylinderGeo=new T.CylinderGeometry(1,1,1,8);
 const pointInside=(x,z,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 function add(color,x,y,z,w,h,d,angle=0,pitch=0,shape='box'){
  if(![x,y,z,w,h,d,angle,pitch].every(Number.isFinite)||Math.min(w,h,d)<=0)return;
  const cell=`${Math.floor(x/90)},${Math.floor(z/90)}`,key=cell+':'+color+':'+shape;
  if(!batches.has(key))batches.set(key,{color,shape,matrices:[]});
  dummy.position.set(x,y,z);dummy.rotation.set(pitch,angle,0,'YXZ');dummy.scale.set(w,h,d);dummy.updateMatrix();batches.get(key).matrices.push(dummy.matrix.clone());
 }
 const eligible=[];
 for(const b of buildings){
  const points=b.points;if(!points||points.length<4||b.h<3)continue;
  const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  if(minX<-12&&maxX>-60&&minZ<15&&maxZ>-14)continue;
  if(minX<office[0]+35&&maxX>office[0]-35&&minZ<office[1]+35&&maxZ>office[1]-35)continue;
  const x=(minX+maxX)/2,z=(minZ+maxZ)/2,homeDistance=Math.hypot(x+36,z),officeDistance=Math.hypot(x-office[0],z-office[1]);
  if(homeDistance>150&&officeDistance>180)continue;
  eligible.push({b,x,z,minX,maxX,minZ,maxZ,distance:Math.min(homeDistance,officeDistance)});
 }
 eligible.sort((a,b)=>a.distance-b.distance);
 for(const entry of eligible.slice(0,120)){
  const {b,x,z,minX,maxX,minZ,maxZ}=entry,p=b.points;let area=0;
  for(let i=0,j=p.length-1;i<p.length;j=i++)area+=p[j][0]*p[i][1]-p[i][0]*p[j][1];
  const sign=area>=0?1:-1,edges=[];
  for(let i=0;i<p.length;i++){
   const a=p[i],end=p[(i+1)%p.length],dx=end[0]-a[0],dz=end[1]-a[1],len=Math.hypot(dx,dz);if(len<.2)continue;
   const tx=dx/len,tz=dz/len,nx=tz*sign,nz=-tx*sign,angle=Math.atan2(nx,nz);
   const e={a,len,tx,tz,nx,nz,angle};edges.push(e);
   const ex=(a[0]+end[0])/2,ez=(a[1]+end[1])/2;
   // Thin inset parapets change the roof silhouette without enlarging footprints.
   add('cream',ex-nx*.13,b.h+.31,ez-nz*.13,len,.58,.2,angle);
   add('stone',ex-nx*.13,b.h+.64,ez-nz*.13,len+.03,.08,.26,angle);
  }
  const facades=edges.filter(e=>e.len>=5&&e.len<42).sort((a,b)=>b.len-a.len).slice(0,2);
  const accent=['cream','rose','terracotta','teal'][Math.abs(Number(b.id)||0)%4];
  facades.forEach((e,edgeIndex)=>{
   const {a,len,tx,tz,nx,nz,angle}=e;
   const at=(s,out=0)=>[a[0]+tx*s+nx*out,a[1]+tz*s+nz*out];
   const width=Math.min(4.6,len*.55),middle=len*.5,floors=Math.min(6,Math.floor((b.h-1)/3));
   // Alternate solid-sided and open steel balconies, projecting less than a metre.
   for(let floor=1;floor<floors;floor++){
    if((floor+edgeIndex+(Number(b.id)||0))%3===0)continue;
    const y=floor*3+.15,depth=.85,[bx,bz]=at(middle,depth*.48);
    add(accent,bx,y,bz,width,.19,depth,angle);
    const [rx,rz]=at(middle,depth);
    add('metal',rx,y+.9,rz,width,.055,.055,angle);
    add('metal',rx,y+.35,rz,width,.035,.035,angle);
    for(let k=-width/2;k<=width/2+.01;k+=.38){const [px,pz]=at(middle+k,depth);add('metal',px,y+.48,pz,.035,.88,.035,angle);}
    for(const side of [-1,1]){const [sx,sz]=at(middle+side*width*.5,depth*.5);add('metal',sx,y+.9,sz,.05,.055,depth,angle);add('metal',sx,y+.48,sz,.035,.88,.035,angle);}
    // Short colored spandrel panels give each apartment frontage a distinct rhythm.
    if(floor%2===0){const [px,pz]=at(middle-width*.32,depth+.02);add(accent,px,y+.4,pz,width*.32,.58,.09,angle);}
   }
   const [px,pz]=at(.45,.12);add('pipe',px,b.h*.5,pz,.035,b.h,.035,angle,0,'cylinder');
   const [gutterX,gutterZ]=at(middle,-.02);add(accent,gutterX,3.12,gutterZ,len*.9,.25,.14,angle);
   // Ground-floor shutters and corrugated sloping rain shades.
   if(edgeIndex===0&&(Number(b.id)||0)%3!==0){
    const sw=Math.min(3.6,len*.55),[sx,sz]=at(middle,.08);
    add('shutter',sx,1.3,sz,sw,2.45,.09,angle);
    for(let y=.2;y<2.55;y+=.16)add('silver',sx,y,sz,sw,.022,.12,angle);
    for(const side of [-1,1]){const [fx,fz]=at(middle+side*(sw*.5+.05),.12);add('stone',fx,1.35,fz,.11,2.6,.2,angle);}
    const [ax,az]=at(middle,.5);add(accent,ax,2.87,az,sw+.4,.065,1.1,angle,.12);
    for(let k=-sw*.5;k<sw*.5;k+=.19){const [cx,cz]=at(middle+k,.5);add('silver',cx,2.9,cz,.027,.025,1.1,angle,.12);}
   }
  });
  // A compact stairwell housing sits entirely inside suitable roof footprints.
  const rw=Math.min(3.1,(maxX-minX)*.24),rd=Math.min(2.4,(maxZ-minZ)*.24);
  if((Number(b.id)||0)%2===0&&rw>1.2&&rd>1.2&&[-1,1].every(sx=>[-1,1].every(sz=>pointInside(x+sx*rw*.6,z+sz*rd*.6,p)))){
   add(accent,x,b.h+1.05,z,rw,2.1,rd);
   add('cream',x,b.h+2.18,z,rw+.25,.16,rd+.25);
   add('dark',x,b.h+.85,z+rd*.5+.03,.7,1.7,.06);
  }
 }
 const materials=new Map();let count=0;
 for(const batch of batches.values()){
  if(!materials.has(batch.color))materials.set(batch.color,new T.MeshStandardMaterial({color:palette[batch.color],roughness:batch.color==='metal'?.45:.88,metalness:['metal','silver','shutter'].includes(batch.color)?.3:0}));
  const mesh=new T.InstancedMesh(batch.shape==='box'?boxGeo:cylinderGeo,materials.get(batch.color),batch.matrices.length);
  batch.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);count+=batch.matrices.length;
 }
 group.userData={buildings:Math.min(eligible.length,120),detailInstances:count,batches:batches.size};world.add(group);return group;
}
