import * as T from 'three';
import {daylight} from './lighting.js';
import {createAnimeSky,setAnimeMood} from './anime-art.js';

/**
 * Golden anime-inspired key, cool lilac bounce, painted sky and real HDRI reflections.
 * Install once on a fresh world scene, then call update(player.position) each
 * frame. setMood('morning'|'evening') changes light, painted sky and shop glows.
 * Character materials remain untouched, retaining their original painted detail.
 */
export async function setupStorybookLighting(scene,renderer){
 const previous={background:scene.background,environment:scene.environment,fog:scene.fog,backgroundIntensity:scene.backgroundIntensity,environmentIntensity:scene.environmentIntensity,backgroundBlurriness:scene.backgroundBlurriness};
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.04;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=T.PCFSoftShadowMap;

 const rig=new T.Group();rig.name='Storybook miniature light';
 // Restrained cool fill leaves room for the warm key to model faces and plaster.
 const skyFill=new T.HemisphereLight(0x9bcada,0x9380a9,.68);
 const rim=new T.DirectionalLight(0x8bd8e9,.62);rim.position.set(45,30,-42);rig.add(rim);
 const sun=new T.DirectionalLight(0xffe0b1,2.9);
 sun.name='Soft morning sun';sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:240});
 sun.shadow.camera.updateProjectionMatrix();
 sun.shadow.bias=-.000045;sun.shadow.normalBias=.02;
 rig.add(skyFill,sun,sun.target);scene.add(rig);
 const haze=new T.Fog(0xd4d6e2,100,260);scene.fog=haze;
 // 64m / 2048 gives roughly 3cm shadow texels around the active characters,
 // while the 240m depth range retains the seven-floor apartment's silhouette.
 const shadowTexel=64/2048;
 const moods={
  morning:{key:0xffd59a,keyPower:3.15,sky:0x94c7df,bounce:0x9b83ad,fill:.68,environment:.24,background:.92,haze:0xd4d6e2,offset:[-44,62,32]},
  evening:{key:0xffb46f,keyPower:2.35,sky:0x849bd9,bounce:0x9672aa,fill:.53,environment:.18,background:.78,haze:0xc5b4d1,offset:[-54,36,25]}
 };
 const offset=new T.Vector3(...moods.morning.offset),lastFocus=new T.Vector3();
 const backward=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3(),target=new T.Vector3();
 const skies={morning:createAnimeSky('morning'),evening:createAnimeSky('evening')};
 let assets=null,disposed=false,mood='morning';
 function update(focus){
  if(disposed)return;
  lastFocus.set(focus?.x||0,0,focus?.z||0);
  // Snap in the light's own image plane, preserving stable shadow texels as
  // the follow camera and active character move through a miniature set.
  backward.copy(offset).normalize();right.set(0,1,0).cross(backward).normalize();up.copy(backward).cross(right);
  const x=Math.round(lastFocus.dot(right)/shadowTexel)*shadowTexel;
  const y=Math.round(lastFocus.dot(up)/shadowTexel)*shadowTexel;
  target.copy(right).multiplyScalar(x).addScaledVector(up,y).addScaledVector(backward,lastFocus.dot(backward));
  sun.target.position.copy(target);sun.position.copy(target).add(offset);
 }
 function setMood(next='morning'){
  if(disposed)return;
  const light=moods[next];if(!light)throw new Error(`Unknown storybook lighting mood: ${next}`);
  mood=next;sun.color.setHex(light.key);sun.intensity=light.keyPower;
  skyFill.color.setHex(light.sky);skyFill.groundColor.setHex(light.bounce);skyFill.intensity=light.fill;
  scene.environmentIntensity=light.environment;scene.background=skies[next];scene.backgroundIntensity=light.background;scene.backgroundBlurriness=0;setAnimeMood(scene,next);rim.intensity=next==='evening'?.4:.62;
  haze.color.setHex(light.haze);offset.set(...light.offset);sun.name=`Storybook ${next} sun`;
  update(lastFocus);
 }
 function dispose(){
  if(disposed)return;disposed=true;scene.remove(rig);
  sun.shadow.map?.dispose();sun.shadow.mapPass?.dispose();
  if(scene.fog===haze)scene.fog=previous.fog;
  if(assets){
   if(scene.background===assets.hdr||Object.values(skies).includes(scene.background)){scene.background=previous.background;scene.backgroundIntensity=previous.backgroundIntensity;scene.backgroundBlurriness=previous.backgroundBlurriness;}
   if(scene.environment===assets.environment){scene.environment=previous.environment;scene.environmentIntensity=previous.environmentIntensity;}
   assets.hdr.dispose();assets.environment.dispose();
  }
 }
 update();
 try{
  assets=await daylight(scene,renderer);
  setMood('morning');
  scene.backgroundBlurriness=0;
  // Actual HDRI remains the reflection environment; visible sky is painted anime art.
  scene.backgroundRotation.y=.9;scene.environmentRotation.y=.9;
 }catch(error){dispose();throw error;}
 return {update,setMood,dispose,rig,sun,get mood(){return mood;}};
}
