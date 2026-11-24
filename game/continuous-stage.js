import * as T from 'three';

// Scene-space scenic plates: the group stays at the origin while characters and
// camera travel. Repeated chapters receive new absolute X coordinates.
export async function createContinuousStage(scene,n){
 const WIDTH=18,HEIGHT=10.125,FOOTLINE=.86,Y=(FOOTLINE-.5)*HEIGHT;
 const root=new T.Group();root.name='Continuous painted memory street';scene.add(root);
 const panels=new Map(),textures=new Map(),pending=new Map(),claims=new Map(),loader=new T.TextureLoader();
 let stops=[...(n.stops||[])],currentStop=null,disposed=false,generation=0,pavementTexture=null,serial=0,cartStop=null;
 const panelGeometry=new T.PlaneGeometry(WIDTH,HEIGHT);
 const pavementGeometry=new T.PlaneGeometry(WIDTH*7,3.2);
 const pavementMaterial=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false,fog:false,depthWrite:true});
 const pavement=new T.Mesh(pavementGeometry,pavementMaterial);pavement.name='Continuous painted pavement';pavement.position.set(0,-1.4,-1.5);pavement.visible=false;root.add(pavement);
 const props=new T.Group();props.name='Independent 3D props attach outside scenic plates';root.add(props);
 const sourceCart=n.world?.getObjectByName('Nariyal paani cart and seller');
 const cart=sourceCart?.clone(true)||null;
 if(cart){cart.name='Coconut memory cart';cart.rotation.set(0,0,0);cart.scale.setScalar(.85);cart.visible=false;props.add(cart);}
 function showCart(stop){cartStop=stop?.id==='coconut'?{...stop}:null;if(!cart)return;cart.visible=!!cartStop;if(cartStop)cart.position.set(cartStop.x-3.6,0,-2);}
 function valid(stop){if(!stop||!Number.isFinite(stop.x)||!/^[a-z0-9-]+$/.test(stop.id))throw new Error('Continuous stage requires a valid chapter ID and finite X');}
 async function textureFor(id){
  if(!textures.has(id))textures.set(id,loader.loadAsync(`assets/stage-art/${id}-v1.png`).then(texture=>{
   texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;
   if(disposed){texture.dispose();throw new Error('Continuous stage disposed');}return texture;
  }).catch(error=>{textures.delete(id);throw error;}));
  return textures.get(id);
 }
 const slotFor=stop=>stop.x.toFixed(4),keyFor=stop=>`${slotFor(stop)}:${stop.id}`;
 async function requestPanel(stop,priority=2,epoch=generation){
  valid(stop);if(disposed||(priority===1&&epoch!==generation))return false;
  const slot=slotFor(stop),key=keyFor(stop),oldClaim=claims.get(slot);
  // An explicitly chosen destination owns its slot. Guessed neighbors can
  // never replace it, including requests that finish later on the network.
  if(priority===1&&oldClaim?.priority===2&&oldClaim.id!==stop.id)return false;
  let claim=oldClaim;
  if(!claim||claim.id!==stop.id){claim={id:stop.id,priority,token:++serial,epoch};claims.set(slot,claim);}
  else{claim.priority=Math.max(priority,claim.priority);claim.epoch=epoch;}
  if(panels.has(key))return true;
  const requestKey=`${key}:${claim.token}`;
  if(pending.has(requestKey))return pending.get(requestKey);
  const task=(async()=>{
   const texture=await textureFor(stop.id);
   if(disposed||claims.get(slot)!==claim||(claim.priority===1&&claim.epoch!==generation))return false;
   // Keep the previous plate until its replacement has loaded, then swap it
   // atomically. There is exactly one mesh per occupied physical slot.
   for(const [oldKey,panel] of panels)if(slotFor(panel.userData.stop)===slot){panel.removeFromParent();panel.material.dispose();panels.delete(oldKey);}
   const material=new T.MeshBasicMaterial({map:texture,toneMapped:false,fog:false});
   const panel=new T.Mesh(panelGeometry,material);panel.name=`Painted ${stop.id} at ${key}`;
   panel.position.set(stop.x,Y,-3.4);panel.userData.chapter=stop.id;panel.userData.stop={...stop};root.add(panel);panels.set(key,panel);return true;
  })().finally(()=>pending.delete(requestKey));pending.set(requestKey,task);return task;
 }
 const preload=stop=>requestPanel(stop,2);
 function setRoute(route){if(!Array.isArray(route)||!route.length)throw new Error('Continuous stage route must contain chapters');stops=route.map(item=>typeof item==='string'?{id:item,z:0}:{...item});generation++;}
 async function prepareJourney(from,to){
  valid(from);valid(to);if(disposed)return false;
  // Claim both ends before either image resolves. Nonadjacent chapter IDs can
  // therefore occupy adjacent physical slots without route guesses winning.
  const request=++generation,results=await Promise.all([preload(from),preload(to)]);
  if(disposed||request!==generation)return false;if(to.id==='coconut')showCart(to);else if(from.id==='coconut')showCart(from);else showCart(null);
  return results.every(Boolean);
 }
 function neighbors(stop){
  const index=stops.findIndex(s=>s.id===stop.id);if(index<0||!stops.length)return [];
  return [-2,-1,1,2].map(delta=>({...stops[(index+delta+stops.length*2)%stops.length],x:stop.x+delta*WIDTH,z:0}));
 }
 function trim(){
  if(!currentStop)return;
  for(const [key,panel] of panels)if(Math.abs(panel.position.x-currentStop.x)>WIDTH*2+.01){panel.removeFromParent();panel.material.dispose();panels.delete(key);}
  for(const [slot] of claims)if(Math.abs(Number(slot)-currentStop.x)>WIDTH*2+.01)claims.delete(slot);
 }
 async function setChapter(stop){
  valid(stop);if(disposed)return false;const request=++generation;
  const loaded=await preload(stop);if(!loaded||disposed||request!==generation)return false;
  currentStop={...stop,z:0};root.userData.chapter=stop.id;root.userData.stageWidth=WIDTH;
  pavement.position.x=stop.x;root.visible=true;showCart(stop);trim();
  // Neighbor panels load off the critical path; callers can await preload(next)
  // before a ride. The modulo sequence also fills either side on later laps.
  Promise.allSettled(neighbors(stop).map(s=>requestPanel(s,1,request))).then(()=>{if(request===generation)trim();});
  return true;
 }
 function resize(){/* Fixed world dimensions preserve panel joins at every viewport size. */}
 function update(){/* Backdrops deliberately remain stationary in world space. */}
 function dispose(){
  if(disposed)return;disposed=true;generation++;root.removeFromParent();
  for(const panel of panels.values())panel.material.dispose();panels.clear();claims.clear();
  panelGeometry.dispose();pavementGeometry.dispose();pavementMaterial.dispose();pavementTexture?.dispose();
  for(const promise of textures.values())promise.then(texture=>texture.dispose()).catch(()=>{});textures.clear();
 }
 try{
  const home=await textureFor('home');pavementTexture=home.clone();
  // Texture coordinates start at the image bottom. Repeat only the original
  // illustrated paving, avoiding buildings and props in the sampled band.
  pavementTexture.wrapS=T.RepeatWrapping;pavementTexture.wrapT=T.ClampToEdgeWrapping;
  pavementTexture.repeat.set(7,.12);pavementTexture.offset.set(0,0);pavementTexture.needsUpdate=true;
  pavementMaterial.map=pavementTexture;pavementMaterial.needsUpdate=true;pavement.visible=true;
  if(stops.length)await setChapter(stops[0]);
 }catch(error){dispose();throw error;}
 return {root,panels,pavement,props,cart,floor:null,setChapter,preload,setRoute,prepareJourney,resize,update,dispose,
  get currentChapter(){return currentStop;},get propColliders(){return cart?.visible&&cartStop?[{x:cartStop.x-3.6,z:-2,w:2.55,d:2.125}]:[];}};
}
