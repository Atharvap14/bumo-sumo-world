import * as T from 'three';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
// Poly Haven CC0 facade components, instanced over the mapped neighbourhood.
export async function facadeDetails(world,windows,progress){
 progress('Fitting textured apartment windows');const loader=new GLTFLoader();const kit=(await loader.loadAsync('assets/polyhaven/modular_urban_apartments_facade/modular_urban_apartments_facade.gltf')).scene;
 const variants=['window_centered_large_01','window_centered_double_02','window_centered_small_02'];
 for(let k=0;k<variants.length;k++){
  const source=kit.getObjectByName(variants[k]);if(!source)continue;source.position.set(0,0,0);source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),centre=bounds.getCenter(new T.Vector3());
  const entries=windows.filter((_,i)=>i%3===k);source.traverse(m=>{if(!m.isMesh)return;const geo=m.geometry.clone().applyMatrix4(m.matrixWorld);geo.translate(-centre.x,-centre.y,-centre.z);const material=m.material.clone();material.side=T.DoubleSide;const inst=new T.InstancedMesh(geo,material,entries.length),dummy=new T.Object3D();entries.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.set(p.w*1.35/size.x,p.h*1.15/size.y,1);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});inst.castShadow=true;inst.receiveShadow=true;world.add(inst);});
 }
 return kit;
}
export async function realisticTrees(world,locations){
 const g=(await new GLTFLoader().loadAsync('assets/architecture/jacaranda-tree.glb')).scene;
 g.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(g),height=bounds.max.y-bounds.min.y,center=bounds.getCenter(new T.Vector3());
 // Spatial batches let the renderer cull distant trees instead of drawing the
 // entire 3.6 km avenue whenever any part of it is on screen.
 const cells=new Map();
 locations.forEach((p,i)=>{const key=`${Math.floor(p[0]/100)},${Math.floor(p[1]/100)}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push({p,i});});
 const group=new T.Group();group.name='Poly Haven broadleaf avenue';
 g.traverse(m=>{if(!m.isMesh)return;
  const geo=m.geometry.clone().applyMatrix4(m.matrixWorld);geo.translate(-center.x,-bounds.min.y,-center.z);
  for(const entries of cells.values()){
   const inst=new T.InstancedMesh(geo,m.material,entries.length),d=new T.Object3D();
   entries.forEach(({p,i},j)=>{d.position.set(p[0],.1,p[1]);d.rotation.set(0,i*2.399,0);const scale=(9+(i%5)*1.2)/height;d.scale.setScalar(scale);d.updateMatrix();inst.setMatrixAt(j,d.matrix);});
   inst.instanceMatrix.needsUpdate=true;inst.computeBoundingBox();inst.computeBoundingSphere();inst.castShadow=true;inst.receiveShadow=true;group.add(inst);
  }
 });
 world.add(group);return group;
}
