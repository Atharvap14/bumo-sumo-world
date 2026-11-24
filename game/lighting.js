import * as T from 'three';
import {HDRLoader} from '../vendor/loaders/HDRLoader.js';
export async function daylight(scene,renderer){
 const hdr=await new HDRLoader().loadAsync('assets/environment/bangalore-day.hdr');hdr.mapping=T.EquirectangularReflectionMapping;
 const pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();const environment=pmrem.fromEquirectangular(hdr).texture;pmrem.dispose();
 scene.background=hdr;scene.environment=environment;scene.backgroundIntensity=.8;scene.environmentIntensity=.65;scene.backgroundRotation.y=.9;scene.environmentRotation.y=.9;
 return {hdr,environment};
}
