import * as T from 'three';

// Flat illustrated scenery, real 3D heroes and selected props. Chapter changes
// commit only after their image loads; callers retain the existing 3D fallback
// when an illustration is unavailable.
export async function createPaintedStage(scene,n){
 const root=new T.Group();root.name='Painted memory stage';root.visible=false;scene.add(root);
 const loader=new T.TextureLoader(),cache=new Map();let generation=0,currentStop=null,disposed=false;
 const backdropMaterial=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false,fog:false});
 const backdrop=new T.Mesh(new T.PlaneGeometry(1,1),backdropMaterial);backdrop.name='Illustrated chapter background';backdrop.position.set(0,3.7,-3.4);backdrop.scale.set(16,9,1);root.add(backdrop);
 const floorMaterial=new T.ShadowMaterial({opacity:.22});
 const floor=new T.Mesh(new T.PlaneGeometry(24,12),floorMaterial);floor.name='Shallow stage pavement';floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;root.add(floor);
 // A low, neutral curb frames the foreground without intersecting the entrance
 // paths (all entrances run near local Z=0, from X=-6 through the two heroes).
 const curb=new T.Mesh(new T.BoxGeometry(24,.10,.17),new T.MeshStandardMaterial({color:0xa8a4a0,roughness:.95}));curb.name='Foreground curb';curb.position.set(0,.015,2.8);curb.receiveShadow=true;root.add(curb);curb.visible=false;
 const props=new T.Group();props.name='Selected 3D memory props';root.add(props);
 const coconutSource=n.world?.getObjectByName('Nariyal paani cart and seller');
 const cart=coconutSource?.clone(true)||null;
 if(cart){cart.position.set(3.55,0,-1.6);cart.rotation.set(0,-.12,0);cart.visible=false;props.add(cart);}
 const pointPositions=new Float32Array(45),pointOrigins=[];
 for(let i=0;i<15;i++){const p=[-6+((i*4.317)%12),.55+((i*1.371)%3.2),-2.9+((i*.593)%1.4)];pointOrigins.push(p);pointPositions.set(p,i*3);}
 const fireGeometry=new T.BufferGeometry();fireGeometry.setAttribute('position',new T.BufferAttribute(pointPositions,3));
 const fireMaterial=new T.PointsMaterial({color:0xffdd9d,size:.035,transparent:true,opacity:.65,depthWrite:false,toneMapped:false});
 const fireflies=new T.Points(fireGeometry,fireMaterial);fireflies.name='Evening fireflies';fireflies.visible=false;root.add(fireflies);
 const evening=new Set(['momos','nails','falooda','waiwai','comedy','cinema']);
 function fitTexture(){
  const texture=backdropMaterial.map;if(!texture)return;
  const image=texture.image,imageAspect=(image.naturalWidth||image.width)/(image.naturalHeight||image.height),planeAspect=backdrop.scale.x/backdrop.scale.y;
  // Cover the plane without stretching faces, doorways or painted architecture.
  const repeatX=Math.min(1,planeAspect/imageAspect),repeatY=Math.min(1,imageAspect/planeAspect);
  texture.repeat.set(repeatX,repeatY);texture.offset.set((1-repeatX)/2,(1-repeatY)/2);texture.needsUpdate=true;
 }
 async function getTexture(id){
  if(!/^[a-z0-9-]+$/.test(id))throw new Error('Invalid painted-stage chapter id');
  if(!cache.has(id)){
   const src=`assets/stage-art/${id}-v1.png`;
   cache.set(id,loader.loadAsync(src).then(texture=>{texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.userData.source=src;return texture;}).catch(()=>{cache.delete(id);throw new Error(`Painted chapter illustration unavailable: ${src}`);}));
  }
  return cache.get(id);
 }
 async function setChapter(stop){
  if(disposed)throw new Error('Painted stage has been disposed');
  if(!stop||!Number.isFinite(stop.x)||!Number.isFinite(stop.z))throw new Error('Painted stage needs a chapter with finite x/z coordinates');
  const request=++generation,texture=await getTexture(stop.id);
  if(disposed||request!==generation)return false;
  backdropMaterial.map=texture;backdropMaterial.needsUpdate=true;fitTexture();
  root.position.set(stop.x-.55,0,stop.z);currentStop=stop;root.userData.chapter=stop.id;root.userData.source=texture.userData.source;
  fireflies.visible=evening.has(stop.id);if(cart)cart.visible=false;
  curb.material.color.set(evening.has(stop.id)?0x8e879b:0xa8a4a0);
  root.visible=true;return true;
 }
 function resize(width=16,height=9){if(!(width>0&&height>0))throw new Error('Painted backdrop size must be positive');backdrop.scale.set(width,height,1);backdrop.position.y=2.65;fitTexture();}
 function update(time){if(!root.visible||!fireflies.visible)return;for(let i=0;i<pointOrigins.length;i++){const p=pointOrigins[i];pointPositions[i*3]=p[0]+Math.sin(time*.25+i*2.3)*.12;pointPositions[i*3+1]=p[1]+Math.cos(time*.37+i)*.12;}fireGeometry.attributes.position.needsUpdate=true;fireMaterial.opacity=.58+Math.sin(time*.6)*.08;}
 function dispose(){disposed=true;generation++;root.removeFromParent();for(const mesh of [backdrop,floor,curb]){mesh.geometry.dispose();mesh.material.dispose();}fireGeometry.dispose();fireMaterial.dispose();for(const pending of cache.values())pending.then(texture=>texture.dispose()).catch(()=>{});cache.clear();}
 return {root,backdrop,floor,props,cart,setChapter,update,resize,dispose,get currentChapter(){return currentStop;},get propColliders(){return currentStop?.id==='coconut'&&cart?[{x:currentStop.x+3,z:currentStop.z-1.6,w:3.1,d:2.65}]:[];}};
}
