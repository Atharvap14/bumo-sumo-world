import * as T from 'three';

// Real, skeleton-bound outfit meshes. Face, hair, hands and the source textures
// remain intact. The original denim faces are hidden underneath each costume.
const wardrobes=new WeakMap();
const IDS=new Set(['casual','office','dinner','commute','spider','sleep','swim']);
function fabricTexture(kind){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 const base={office:'#e5e4dc',commute:'#e9e8de',trousers:'#797975',sleep:'#d4a8a5',sleepNeutral:'#6b727a',polo:'#283038',light:'#e2d5ba',black:'#25232a',spider:'#28252e',swim:'#467d80'}[kind]||'#ded8c7';c.fillStyle=base;c.fillRect(0,0,256,256);
 if(kind==='office'){for(let x=0;x<256;x+=22){c.fillStyle='#8b9290';c.fillRect(x,0,6,256);c.fillStyle='#b5b9b4';c.fillRect(x+10,0,2,256);}}
 if(kind==='commute'){for(let y=0;y<256;y+=32){c.fillStyle='#293b4c';c.fillRect(0,y,256,13);}}
 // Very fine weave, subtle enough to retain the original characters' painted finish.
 c.globalAlpha=.1;c.fillStyle='#ffffff';for(let x=0;x<256;x+=4)c.fillRect(x,0,1,256);c.globalAlpha=.08;c.fillStyle='#11131a';for(let y=0;y<256;y+=4)c.fillRect(0,y,256,1);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;return texture;
}
function material(kind,color){return new T.MeshStandardMaterial({color:color??0xffffff,map:fabricTexture(kind),roughness:.87,metalness:0,side:T.DoubleSide});}
function inRange(v,a,b){return v>=a&&v<=b;}
function sampleSource(mesh){
 const image=mesh.material?.map?.image;if(!image||typeof document==='undefined')return null;
 try{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;return {data,w:c.width,h:c.height,flipY:mesh.material.map.flipY};}catch{return null;}
}
function pixel(texture,u,v){if(!texture)return null;u=((u%1)+1)%1;v=((v%1)+1)%1;const x=Math.min(texture.w-1,Math.floor(u*texture.w)),y=Math.min(texture.h-1,Math.floor((texture.flipY?1-v:v)*texture.h)),i=(y*texture.w+x)*4;return [texture.data[i],texture.data[i+1],texture.data[i+2]];}
function initialize(root){
 const height=root.userData.height||2.2,character=root.userData.character||'bumo',broad=character==='sumo';
 let source;root.traverse(m=>{if(!source&&m.isSkinnedMesh&&!m.userData.wardrobe)source=m;});
 if(!source)throw new Error('Wardrobe requires the rigged '+character+' character');
 root.updateMatrixWorld(true);source.geometry=source.geometry.clone();
 const toRoot=new T.Matrix4().copy(root.matrixWorld).invert().multiply(source.matrixWorld),toMesh=toRoot.clone().invert();
 const geometry=source.geometry,position=geometry.attributes.position,uv=geometry.attributes.uv,originalIndex=geometry.index?Array.from(geometry.index.array):Array.from({length:position.count},(_,i)=>i);
 const points=[],tex=sampleSource(source),colors=[];let skin=[0,0,0],skinCount=0;const skinSamples=[];
 for(let i=0;i<position.count;i++){
  const p=new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(toRoot);points.push(p);
  const rgb=uv?pixel(tex,uv.getX(i),uv.getY(i)):null;colors.push(rgb);
  const skinRegion=broad?Math.abs(p.x)>height*.19&&inRange(p.y,height*.39,height*.57):Math.abs(p.x)<height*.15&&inRange(p.y,height*.15,height*.34);
  if(rgb&&skinRegion&&rgb[0]>rgb[1]*1.12&&rgb[1]>rgb[2]*1.1)skinSamples.push(rgb);
 }
 // Avoid sampling baked creases/shadows as the new exposed-skin base color.
 skinSamples.sort((a,b)=>(a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]));for(const rgb of skinSamples.slice(Math.floor(skinSamples.length*.45),Math.ceil(skinSamples.length*.8))){skin=skin.map((v,j)=>v+rgb[j]);skinCount++;}
 const skinColor=skinCount?new T.Color().setRGB(...skin.map(c=>c/skinCount/255),T.SRGBColorSpace):new T.Color(0xc48b62);
 const bones=new Map(source.skeleton.bones.map((bone,i)=>[bone.name,i]));
 const bone=name=>bones.get(name)??[...bones].find(([key])=>key.endsWith(name))?.[1]??bones.get('Root')??0;
 const state={root,source,height,character,broad,toRoot,toMesh,originalIndex,points,colors,bone,skinColor,outfits:new Map(),active:null,masks:new Map()};
 wardrobes.set(root,state);return state;
}
function skinWeights(state,p,zone){
 const h=state.height,y=p.y/h,x=Math.abs(p.x)/h;
 if(zone==='head')return [['Head',1]];
 if(zone==='hips')return [['Hips',1]];
 if(zone==='chest')return [['Chest',1]];
 if(zone.includes('Arm')){
  const side=zone.startsWith('left')?'Left':'Right';
  if(y>.65){const w=T.MathUtils.smoothstep(x,.11,.18);return [['Chest',1-w],[side+'UpperArm',w]];}
  const forearm=1-T.MathUtils.smoothstep(y,.535,.585);return [[side+'UpperArm',1-forearm],[side+'LowerArm',forearm]];
 }
 if(zone.includes('Leg')){
  const side=zone.startsWith('left')?'Left':'Right';
  if(y>.47){const hip=T.MathUtils.smoothstep(y,.47,.53);return [[side+'UpperLeg',1-hip],['Hips',hip]];}
  if(y<.10)return [[side+'Foot',1]];
  const lower=1-T.MathUtils.smoothstep(y,.235,.285);return [[side+'UpperLeg',1-lower],[side+'LowerLeg',lower]];
 }
 if(y<.52){const spine=T.MathUtils.smoothstep(y,.46,.54);return [['Hips',1-spine],['Spine',spine]];}
 const chest=T.MathUtils.smoothstep(y,.54,.64);return [['Spine',1-chest],['Chest',chest]];
}
function createOutfit(state,id){
 const {source,height:h,broad,toMesh,bone}=state;const group=new T.Group();group.name=state.character+' '+id+' wardrobe';source.parent.add(group);
 const meshes=[],mats=new Map(),coveredTriangles=new Set();
 const cloth=kind=>{if(!mats.has(kind))mats.set(kind,material(kind));return mats.get(kind);};
 const skinMat=new T.MeshStandardMaterial({color:state.skinColor,roughness:.86,side:T.DoubleSide});
 const solid=(color,roughness=.7)=>new T.MeshStandardMaterial({color,roughness,side:T.DoubleSide});
 function bind(geo,mat,zone='torso'){
  const pos=geo.attributes.position,indices=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4),p=new T.Vector3();
  for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i);skinWeights(state,p,zone).forEach(([name,w],j)=>{indices[i*4+j]=bone(name);weights[i*4+j]=w;});}
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geo.applyMatrix4(toMesh);geo.computeVertexNormals();
  const m=new T.SkinnedMesh(geo,mat);m.userData.wardrobe=true;m.name=id+' '+zone;m.position.copy(source.position);m.quaternion.copy(source.quaternion);m.scale.copy(source.scale);m.bindMode=source.bindMode;m.bind(source.skeleton,source.bindMatrix.clone());m.castShadow=true;m.receiveShadow=true;group.add(m);meshes.push(m);return m;
 }
 function shape(geo,mat,zone,p=[0,0,0],scale=[1,1,1],rotation=null){geo.scale(...scale);if(rotation){geo.rotateX(rotation[0]||0);geo.rotateY(rotation[1]||0);geo.rotateZ(rotation[2]||0);}geo.translate(...p);return bind(geo,mat,zone);}
 function ellipse(rings,mat,zone='torso',segments=32){
  const verts=[],uv=[],idx=[];rings.forEach((r,j)=>{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;verts.push((r.x||0)+Math.sin(a)*r.rx,r.y,(r.z||0)+Math.cos(a)*r.rz);uv.push(i/segments,j/(rings.length-1));if(j&&i<segments){const a=(j-1)*(segments+1)+i,b=j*(segments+1)+i;idx.push(a,a+1,b,a+1,b+1,b);}}});
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);return bind(g,mat,zone);
 }
 function limb(points,radii,mat,zone){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),verts=[],uv=[],idx=[],segments=20,sides=20;
  for(let j=0;j<=segments;j++){const t=j/segments,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),u=new T.Vector3(0,0,1).cross(tangent).normalize(),v=tangent.clone().cross(u).normalize(),q=t*(radii.length-1),lo=Math.min(radii.length-2,Math.floor(q)),r=T.MathUtils.lerp(radii[lo],radii[lo+1],q-lo);
   for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,point=p.clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r*.86);verts.push(...point);uv.push(i/sides,t);if(j&&i<sides){const a=(j-1)*(sides+1)+i,b=j*(sides+1)+i;idx.push(a,a+1,b,a+1,b+1,b);}}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);return bind(g,mat,zone);
 }
 function line(points,radius,mat,zone){return bind(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,radius,6,false),mat,zone);}
 const torsoX=broad?.185:.12,bodyZ=broad?0:.048,torsoDepth=broad?.155:.069;
 function torso(mat,hem=.505,neck=.715,fit=1){
  const profile=broad?[[hem,.185,.15],[.52,.182,.153],[.58,.18,.132],[.63,.176,.114],[.66,.165,.103],[.68,.145,.09],[.70,.104,.067],[neck,.058,.049]]:[[hem,.118,.068],[.55,.108,.067],[.60,.115,.069],[.64,.12,.066],[.66,.119,.063],[.68,.101,.055],[.70,.072,.044],[neck,.046,.035]];
  return ellipse(profile.map(([y,rx,rz])=>({y:y*h,rx:rx*h*fit,rz:rz*h*fit,z:bodyZ*h})),mat);
 }
 // Rebuild a fitted shirt shell from the original body's actual surface and
 // bone weights. This preserves rounded shoulders and elbow contours rather
 // than asking a wide cylinder to approximate the character silhouette.
 function conformedTop(mat,long=false,lower=false){
  const src=source.geometry,normal=src.attributes.normal,ii=src.attributes.skinIndex,ww=src.attributes.skinWeight;
  const positions=[],normals=[],uvs=[],indices=[],weights=[];
  for(let t=0;t<state.originalIndex.length;t+=3){
   const tri=state.originalIndex.slice(t,t+3),p=new T.Vector3();tri.forEach(i=>p.addScaledVector(state.points[i],1/3));
   const y=p.y/h,x=Math.abs(p.x)/h,z=p.z/h,denim=tri.some(i=>isDenim(state.colors[i]));
   const body=inRange(y,broad?.40:.46,.735)&&x<(broad?.20:.14)&&(broad||z>-.045);
   const sleeve=denim&&inRange(y,long?.45:.60,.735);
   const lowerBody=lower&&x<(broad?.21:.145)&&(lower==='pajamas'?inRange(y,.075,.53):lower==='shorts'?inRange(y,.29,.49):inRange(y,broad?.085:.40,broad?.45:.52));
   if(lower?!lowerBody:(!body&&!sleeve))continue;
   coveredTriangles.add(t);
   for(const i of tri){const v=state.points[i].clone();if(lower==='shorts')v.y=Math.max(.29*h,v.y);const n=normal?new T.Vector3().fromBufferAttribute(normal,i).transformDirection(state.toRoot):new T.Vector3(v.x,0,v.z-bodyZ*h).normalize();v.addScaledVector(n,.002*h);positions.push(...v);normals.push(...n);uvs.push(.5+v.x/h*2,v.y/h*3);for(let j=0;j<4;j++){indices.push(ii.array[i*4+j]);weights.push(ww.array[i*4+j]);}}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));g.applyMatrix4(toMesh);
  const m=new T.SkinnedMesh(g,mat);m.userData.wardrobe=true;m.name=id+' fitted shirt';m.position.copy(source.position);m.quaternion.copy(source.quaternion);m.scale.copy(source.scale);m.bind(source.skeleton,source.bindMatrix.clone());m.castShadow=true;m.receiveShadow=true;group.add(m);meshes.push(m);

 }
 function sleeves(mat,long=false,puff=false){
  for(const side of [-1,1]){const zone=side<0?'rightArm':'leftArm',shoulder=(broad?.17:.125),elbow=(broad?.26:.205),wrist=(broad?.31:.26),r=broad?.075:.057;
   const points=long?[[side*shoulder*h,.675*h,bodyZ*h],[side*elbow*h,.56*h,bodyZ*h],[side*wrist*h,.465*h,bodyZ*h]]:[[side*shoulder*h,.675*h,bodyZ*h],[side*(shoulder+(elbow-shoulder)*.45)*h,.623*h,bodyZ*h],[side*(shoulder+(elbow-shoulder)*.63)*h,.603*h,bodyZ*h]];
   limb(points,[r*h,(puff?r*1.22:r*.91)*h,(long?r*.62:r*.85)*h],mat,zone);
  }
 }
 function trousers(mat){
  const hipWidth=broad?.115:.084,legX=broad?.105:.083;
  for(const side of [-1,1])ellipse([{y:.075*h,x:side*legX*h,z:.035*h,rx:(broad?.082:.068)*h,rz:.068*h},{y:.255*h,x:side*legX*h,z:.035*h,rx:(broad?.09:.066)*h,rz:.07*h},{y:.44*h,x:side*legX*h,z:.033*h,rx:hipWidth*h,rz:(broad?.102:.086)*h},{y:.525*h,x:side*legX*h,z:.033*h,rx:hipWidth*h,rz:(broad?.102:.086)*h}],mat,side<0?'rightLeg':'leftLeg');
  ellipse([{y:.49*h,rx:(broad?.22:.168)*h,rz:(broad?.105:.087)*h,z:.035*h},{y:.53*h,rx:(broad?.21:.163)*h,rz:(broad?.103:.085)*h,z:.035*h}],mat,'hips');
 }
 function glasses(){
  const dark=solid(0x5d6269,.35);const eyeY=.880*h,front=.127*h;
  for(const side of [-1,1]){
   const points=[],w=.085*h,hh=.060*h,r=.014*h,cx=side*.052*h;
   for(const [x,y,start] of [[w/2-r,hh/2-r,0],[-w/2+r,hh/2-r,Math.PI/2],[-w/2+r,-hh/2+r,Math.PI],[w/2-r,-hh/2+r,Math.PI*1.5]])for(let k=0;k<5;k++){const a=start+k/4*Math.PI/2;points.push(new T.Vector3(cx+x+Math.cos(a)*r,eyeY+y+Math.sin(a)*r,front));}
   points.push(points[0].clone());bind(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,.0034*h,6,false),dark,'head');
   line([[side*.097*h,eyeY,front],[side*.12*h,eyeY,.065*h],[side*.12*h,eyeY,-.01*h]],.003*h,dark,'head');
  }
  line([[-.01*h,eyeY+.008*h,front],[0,eyeY+.011*h,front+.003*h],[.01*h,eyeY+.008*h,front]],.003*h,dark,'head');
 }
 function shoes(){
  const maroon=solid(0x603743,.3);for(const side of [-1,1]){shape(new T.SphereGeometry(1,24,14),maroon,side<0?'rightLeg':'leftLeg',[side*.086*h,.05*h,.075*h],[.052*h,.045*h,.115*h]);shape(new T.BoxGeometry(1,1,1),solid(0x453535),side<0?'rightLeg':'leftLeg',[side*.086*h,.017*h,.008*h],[.035*h,.032*h,.035*h]);}
 }
 // Use the actual feet and leg skinning, rather than placing approximate ovals
 // at guessed ankle coordinates. Source triangles and their weights stay paired.
 function skinPatch(test,reshape,name){
  const src=source.geometry,ii=src.attributes.skinIndex,ww=src.attributes.skinWeight,positions=[],indices=[],weights=[];
  for(let t=0;t<state.originalIndex.length;t+=3){const tri=state.originalIndex.slice(t,t+3),centre=new T.Vector3();tri.forEach(i=>centre.addScaledVector(state.points[i],1/3));if(!test(centre,tri,t))continue;coveredTriangles.add(t);
   for(const i of tri){const p=state.points[i].clone();reshape(p);positions.push(...p);for(let j=0;j<4;j++){indices.push(ii.array[i*4+j]);weights.push(ww.array[i*4+j]);}}
  }
  if(!positions.length)return;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));g.applyMatrix4(toMesh);g.computeVertexNormals();
  const m=new T.SkinnedMesh(g,skinMat);m.name=id+' '+name;m.userData.wardrobe=true;m.position.copy(source.position);m.quaternion.copy(source.quaternion);m.scale.copy(source.scale);m.bindMode=source.bindMode;m.bind(source.skeleton,source.bindMatrix.clone());m.castShadow=true;m.receiveShadow=true;group.add(m);meshes.push(m);
 }
 function bareFeet(){
  const feet=[-1,1].map(side=>{const points=state.points.filter(p=>Math.sign(p.x)===side&&p.y<.10*h),box=new T.Box3().setFromPoints(points);return box.getCenter(new T.Vector3());});
  skinPatch(p=>p.y<.10*h,p=>{const centre=feet[p.x<0?0:1],amount=.18*(1-T.MathUtils.smoothstep(p.y/h,.035,.065));p.x=T.MathUtils.lerp(p.x,centre.x,amount);p.z=T.MathUtils.lerp(p.z,centre.z,amount);},'attached bare feet');
 }
 function swimLegs(){
  skinPatch(p=>inRange(p.y,.085*h,.335*h)&&Math.abs(p.x)<.23*h,p=>{const amount=.24*T.MathUtils.smoothstep(p.y/h,.10,.16)*(1-T.MathUtils.smoothstep(p.y/h,.29,.335));p.x=T.MathUtils.lerp(p.x,Math.sign(p.x)*.105*h,amount);p.z=T.MathUtils.lerp(p.z,.035*h,amount);},'bare lower legs');
 }
 function backpack(){
  shape(new T.SphereGeometry(1,24,20),solid(0x303c40),'chest',[0,.59*h,-.084*h],[.13*h,.17*h,.055*h]);
  for(const side of [-1,1])line([[side*.09*h,.49*h,-.085*h],[side*.11*h,.70*h,-.06*h],[side*.12*h,.70*h,.04*h],[side*.11*h,.55*h,.12*h]],.013*h,solid(0x343d40),'chest');
  shape(new T.SphereGeometry(1,20,12),solid(0x41494a),'chest',[0,.55*h,-.125*h],[.10*h,.065*h,.02*h]);
 }
 // Restore only exposed sleeve regions. Keep exact source weights and geometry
 // at the hand/forearm seam; approximated weights produced a second moving arm.
 // skinPatch also masks every copied source triangle, including mixed-color
 // cuff border faces that the older two-denim-vertices rule missed.
 const fullSleeves=id==='spider'||(id==='commute'&&!broad)||(id==='sleep'&&broad);
 if(!fullSleeves){
  const exposedTop=id==='dinner'&&!broad?.685:.615;
  skinPatch((centre,tri)=>centre.y<exposedTop*h&&tri.every(i=>Math.abs(state.points[i].x)>h*(broad?.185:.145)&&inRange(state.points[i].y,h*.46,h*.685))&&tri.some(i=>isDenim(state.colors[i])),()=>{},'restored exposed arms');
 }
 if(id==='office'||id==='commute'){
  conformedTop(cloth(broad?'polo':id==='office'?'office':'commute'),id==='commute'&&!broad);if(!broad){trousers(cloth('trousers'));shoes();glasses();if(id==='office')backpack();}
  // Sewn button placket and a small folded collar make the office shirt distinct.
  if(id==='office'){for(let y=.535;y<.69;y+=.028)shape(new T.SphereGeometry(.006*h,8,6),solid(broad?0x858783:0xe9e5dc),'torso',[0,y*h,(bodyZ+torsoDepth+.004)*h]);for(const side of [-1,1])shape(new T.BoxGeometry(1,1,1),cloth(broad?'polo':'office'),'chest',[side*.045*h,.701*h,(bodyZ+.05)*h],[.07*h,.052*h,.007*h],[.18,0,side*.28]);}
 }else if(id==='dinner'){
  if(broad){conformedTop(cloth('polo'));}
  else{
   torso(skinMat,.505,.745,.85);const black=cloth('black');ellipse([{y:.505*h,rx:.158*h,rz:.083*h,z:.04*h},{y:.58*h,rx:.145*h,rz:.082*h,z:.047*h},{y:.67*h,rx:.15*h,rz:.069*h,z:.047*h}],black);
   ellipse([{y:.22*h,rx:.20*h,rz:.105*h,z:.035*h},{y:.34*h,rx:.18*h,rz:.10*h,z:.035*h},{y:.48*h,rx:.17*h,rz:.09*h,z:.035*h},{y:.525*h,rx:.157*h,rz:.084*h,z:.035*h}],black,'hips');
   for(const side of [-1,1])line([[side*.112*h,.65*h,.108*h],[side*.12*h,.707*h,.04*h],[side*.112*h,.65*h,-.024*h]],.012*h,black,'chest');shoes();
  }
 }else if(id==='spider'){
  conformedTop(cloth('spider'),true);if(!broad)trousers(cloth('black'));
  const red=solid(0xb64449);line([[0,.51*h,(bodyZ+torsoDepth+.008)*h],[0,.69*h,(bodyZ+torsoDepth-.01)*h]],.006*h,red,'torso');
  shape(new T.TorusGeometry(.085*h,.035*h,10,28),cloth('spider'),'chest',[0,.716*h,.018*h],[1,1,.7],[Math.PI/2,0,0]);
  for(const side of [-1,1])for(let i=0;i<4;i++)line([[side*.012*h,.615*h,(bodyZ+torsoDepth+.012)*h],[side*(.036+i*.004)*h,(.63-i*.012)*h,(bodyZ+torsoDepth+.014)*h],[side*.06*h,(.65-i*.027)*h,(bodyZ+torsoDepth+.016)*h]],.004*h,red,'chest');
  shape(new T.SphereGeometry(.018*h,12,8),red,'chest',[0,.618*h,(bodyZ+torsoDepth+.016)*h],[.65,1, .35]);
 }else if(id==='sleep'){
  // The supplied sleepy-morning photo shows a black T-shirt.
  conformedTop(cloth(broad?'sleep':'black'),broad);conformedTop(cloth(broad?'sleep':'sleepNeutral'),false,'pajamas');
 }else if(id==='swim'){
  // Fitted teal rashguard and swim bottoms use the existing body surface and
  // original weights. This keeps anatomy intact without synthetic bare tubes.
  conformedTop(cloth('swim'));
  conformedTop(cloth('swim'),false,broad?'shorts':true);if(broad)swimLegs();
 }

 if(id==='sleep'||id==='swim')bareFeet();
 group.visible=false;group.userData.outfit=id;return {group,meshes,coveredTriangles};
}
// Include neutral seam/cuff highlights so pale jacket fragments do not survive
// a costume mask. Warm skin and brown hair remain outside this classification.
function isDenim(rgb){if(!rgb)return false;const low=Math.min(...rgb),high=Math.max(...rgb);return (rgb[2]-rgb[0]>4&&rgb[1]>=rgb[0]&&rgb[2]>rgb[1]*.88&&high<245)||(high-low<24&&low>65);}
function maskFor(state,id){
 if(state.masks.has(id))return state.masks.get(id);const h=state.height,broad=state.broad,keep=[];
 for(let t=0;t<state.originalIndex.length;t+=3){const tri=state.originalIndex.slice(t,t+3),p=new T.Vector3();tri.forEach(i=>p.addScaledVector(state.points[i],1/3));const y=p.y/h,x=Math.abs(p.x)/h,z=p.z/h,denim=tri.filter(i=>isDenim(state.colors[i])).length>=2;
  let hide=false;
  const torso=inRange(y,broad?.40:.42,.735)&&x<(broad?.22:.14)&&(broad||z>-.045);
  const sleeve=inRange(y,.45,.70)&&x>(broad?.185:.145)&&denim;
  hide=torso||sleeve||(denim&&inRange(y,.40,.75));
  // SUMO retains his original jeans outside sleep/swim; BUMO's shorts are covered/replaced.
  if(broad&&y<.42&&id!=='sleep'&&id!=='swim')hide=false;
  if(((id==='office'||id==='commute'||id==='dinner')&&!broad||id==='swim'||id==='sleep')&&y<.085)hide=true;
  if(id==='sleep'&&x<(broad?.21:.145)&&inRange(y,.075,.53))hide=true;
  if(id==='swim'&&broad&&y<.45&&x<.21)hide=true;
  if(id==='swim'&&!broad&&x<.145&&inRange(y,.40,.52))hide=true;
  // Every source triangle used by a fitted replacement must be hidden,
  // including trim at its edge; otherwise two differently colored skins overlap.
  if(state.outfits.get(id)?.coveredTriangles.has(t))hide=true;
  if(!hide)keep.push(...tri);
 }
 const index=new T.Uint32BufferAttribute(keep,1);state.masks.set(id,index);return index;
}
/** Switch real skinned outfits. root.userData.character must identify 'bumo' or 'sumo'. */
export function setOutfit(root,id='casual'){
 if(!IDS.has(id))id='casual';const state=wardrobes.get(root)||initialize(root);
 if(state.active===id)return id;
 for(const outfit of state.outfits.values())outfit.group.visible=false;
 if(id==='casual')state.source.geometry.setIndex(new T.Uint32BufferAttribute(state.originalIndex,1));
 else{
  if(!state.outfits.has(id))state.outfits.set(id,createOutfit(state,id));state.outfits.get(id).group.visible=true;state.source.geometry.setIndex(maskFor(state,id));
 }
 state.source.geometry.computeBoundingBox();state.source.geometry.computeBoundingSphere();state.active=id;root.userData.outfit=id;return id;
}
export function disposeWardrobe(root){
 const state=wardrobes.get(root);if(!state)return;state.source.geometry.setIndex(new T.Uint32BufferAttribute(state.originalIndex,1));
 const materials=new Set();for(const outfit of state.outfits.values()){for(const m of outfit.meshes){m.geometry.dispose();materials.add(m.material);}outfit.group.removeFromParent();}for(const mat of materials){mat.map?.dispose();mat.dispose();}wardrobes.delete(root);
}
