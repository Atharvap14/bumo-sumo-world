import * as T from 'three';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {disposeWardrobe} from './wardrobe.js';

// A variant is a complete, genuinely skinned character GLB, not an overlay.
// Static generated models must first pass through the offline rig pipeline.
// The actor Group is never replaced: authored movement, scale, shadows, seat
// placement, and external references therefore keep using the same object.
export function createCharacterVariants(actor,{loader=new GLTFLoader(),attachments=[],onSwap}={}){
 if(!actor?.userData.body)throw new Error('Character variants require an initialized actor');
 const data=actor.userData,height=data.height||2.2,definitions=new Map(),cache=new Map();
 let active='base',generation=0,disposed=false;
 const base={body:data.body,mixer:data.mixer,actions:data.actions,seatHeight:data.seatHeight,owned:false};
 const accessories=attachments.map(item=>{
  const object=item.object||item,bone=item.bone||object.parent?.name||'Head';
  return {object,bone,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()};
 });
 const clipKey=clip=>clip.name.toLowerCase();
 function register(id,definition){
  if(!id||id==='base')throw new Error('Variant needs a unique non-base ID');
  if(cache.has(id))throw new Error('Cannot redefine an already loaded variant');
  definitions.set(id,typeof definition==='string'?{url:definition}:definition);return api;
 }
 function prepare(gltf,definition){
  if(!gltf?.scene)throw new Error('Variant GLB has no scene');
  const body=gltf.scene;let skin=null;body.traverse(object=>{if(object.isSkinnedMesh)skin=skin||object;});
  if(!skin)throw new Error('Variant is static: rig and animate it before use');
  for(const bone of ['Hips','Head','LeftUpperLeg','RightUpperLeg'])if(!body.getObjectByName(bone))throw new Error(`Variant lacks required bone ${bone}`);
  const clips=gltf.animations||[],names=new Set(clips.map(clipKey));
  for(const state of ['idle','walk','sit'])if(!names.has(state))throw new Error(`Variant lacks ${state} animation`);
  body.updateMatrixWorld(true);const box=new T.Box3().setFromObject(body),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Variant has invalid bounds');
  const scale=height/size.y;body.scale.multiplyScalar(scale);
  body.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  body.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  const mixer=new T.AnimationMixer(body),actions=Object.fromEntries(clips.map(clip=>[clipKey(clip),mixer.clipAction(clip)]));
  return {body,mixer,actions,seatHeight:definition.seatHeight??height*.37,owned:!definition.gltf};
 }
 async function preload(id){
  if(id==='base')return base;if(disposed)throw new Error('Character variants disposed');
  const definition=definitions.get(id);if(!definition)throw new Error(`Unknown character variant ${id}`);
  if(!cache.has(id))cache.set(id,(async()=>{
   const gltf=definition.gltf||await loader.loadAsync(definition.url),state=prepare(gltf,definition);
   if(disposed){release(state);throw new Error('Character variants disposed');}return state;
  })().catch(error=>{cache.delete(id);throw error;}));
  return cache.get(id);
 }
 function commit(id,next){
  if(active===id)return true;
  const previous=data.activeAction,oldDuration=previous?.getClip().duration||1;
  const stateName=previous?clipKey(previous.getClip()):'idle',phase=(previous?.time||0)/oldDuration;
  const speed=previous?.getEffectiveTimeScale()||1;
  // Release wardrobe's per-actor source cache before changing the underlying skin.
  disposeWardrobe(actor);
  for(const accessory of accessories)accessory.object.removeFromParent();
  data.mixer?.stopAllAction();data.body.removeFromParent();actor.add(next.body);
  data.body=next.body;data.mixer=next.mixer;data.actions=next.actions;data.seatHeight=next.seatHeight;
  data.activeAction=null;data.variantId=id;data.variantOutfit=id==='base'?null:id;data.outfit=id==='base'?'casual':id;
  for(const accessory of accessories){
   const bone=next.body.getObjectByName(accessory.bone);
   if(!bone)throw new Error(`Variant lacks accessory bone ${accessory.bone}`);
   bone.add(accessory.object);accessory.object.position.copy(accessory.position);accessory.object.quaternion.copy(accessory.quaternion);accessory.object.scale.copy(accessory.scale);
  }
  const action=next.actions[stateName]||next.actions.idle;
  if(action){action.reset().setEffectiveWeight(1).setEffectiveTimeScale(speed).play();action.time=phase*action.getClip().duration;data.activeAction=action;next.mixer.update(0);}
  actor.updateMatrixWorld(true);active=id;onSwap?.({id,actor,body:next.body});return true;
 }
 async function use(id='base'){
  if(disposed)return false;const request=++generation,next=await preload(id);
  if(disposed||request!==generation)return false;
  // Validate accessory anchors before making any mutation.
  for(const accessory of accessories)if(!next.body.getObjectByName(accessory.bone))throw new Error(`Variant lacks accessory bone ${accessory.bone}`);
  return commit(id,next);
 }
 function release(state){
  state.mixer.stopAllAction();state.mixer.uncacheRoot(state.body);if(!state.owned)return;
  const geometries=new Set(),materials=new Set(),maps=new Set();state.body.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of object.material?(Array.isArray(object.material)?object.material:[object.material]):[])materials.add(material);});
  for(const material of materials)for(const value of Object.values(material))if(value?.isTexture)maps.add(value);
  for(const object of [...geometries,...materials,...maps])object.dispose();
 }
 function dispose(){if(disposed)return;generation++;commit('base',base);disposed=true;for(const promise of cache.values())promise.then(release).catch(()=>{});cache.clear();}
 const api={register,preload,use,restore:()=>use('base'),dispose,has:id=>id==='base'||definitions.has(id),get current(){return active;}};
 return api;
}
