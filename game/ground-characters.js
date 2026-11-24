import * as T from 'three';

// Indexed sole samples are cached per mesh/outfit. Animation is evaluated by
// getVertexPosition(), so this tracks the actual skin rather than its bind box.
const cache=new WeakMap();
const point=new T.Vector3(),inverseRoot=new T.Matrix4(),toRoot=new T.Matrix4(),worldPosition=new T.Vector3();
function visibleMaterial(mesh,materialIndex=0){const material=Array.isArray(mesh.material)?mesh.material[materialIndex]:mesh.material;return !!material&&material.visible!==false&&(!material.transparent||material.opacity>0);}
function sampleIndices(mesh,root){
 const geometry=mesh.geometry,position=geometry.attributes.position,index=geometry.index;
 if(!position)return [];
 const draw=geometry.drawRange,groups=geometry.groups;
 const materialVisibility=Array.isArray(mesh.material)?mesh.material.map(m=>m?.visible!==false&&(!m?.transparent||m.opacity>0)).join(','):String(visibleMaterial(mesh));
 let entry=cache.get(mesh);
 if(entry&&entry.geometry===geometry&&entry.position===position&&entry.positionVersion===position.version&&entry.index===index&&entry.indexVersion===(index?.version||0)&&entry.drawStart===draw.start&&entry.drawCount===draw.count&&entry.materialVisibility===materialVisibility)return entry.indices;
 inverseRoot.copy(root.matrixWorld).invert();toRoot.multiplyMatrices(inverseRoot,mesh.matrixWorld);
 const count=index?index.count:position.count,start=Math.max(0,draw.start),end=Math.min(count,draw.start+draw.count),active=new Set();
 // Geometry masks remove source shoes for some outfits. Never sample a vertex
 // merely because it remains in the position buffer after its triangles vanish.
 const ranges=groups.length?groups:[{start:0,count,materialIndex:0}];
 for(const group of ranges){if(!visibleMaterial(mesh,group.materialIndex))continue;const a=Math.max(start,group.start),b=Math.min(end,group.start+group.count);for(let i=a;i<b;i++)active.add(index?index.getX(i):i);}
 let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
 const vertices=[];
 for(const i of active){point.fromBufferAttribute(position,i).applyMatrix4(toRoot);vertices.push({i,x:point.x,y:point.y,z:point.z});minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);}
 const height=root.userData.height||2.3;let indices=[];
 // Upper garments, glasses, and the helmet cannot define standing ground.
 if(minY<height*.28){
  const band=Math.min(height*.16,Math.max(.035,(maxY-minY)*.15));const soles=vertices.filter(v=>v.y<=minY+band);
  for(const v of soles){minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minZ=Math.min(minZ,v.z);maxZ=Math.max(maxZ,v.z);}
  // A 12×6 sole grid retains toes/heels and both feet, including tilted steps.
  // Lowest and highest samples per cell cover the small sole sidewalls too.
  const cells=new Map();
  for(const v of soles){const x=Math.min(11,Math.floor((v.x-minX)/Math.max(1e-8,maxX-minX)*12)),z=Math.min(5,Math.floor((v.z-minZ)/Math.max(1e-8,maxZ-minZ)*6)),key=x*6+z,cell=cells.get(key);if(!cell)cells.set(key,{low:v,high:v});else{if(v.y<cell.low.y)cell.low=v;if(v.y>cell.high.y)cell.high=v;}}
  indices=[...new Set([...cells.values()].flatMap(c=>[c.low.i,c.high.i]))];
 }
 cache.set(mesh,{geometry,position,positionVersion:position.version,index,indexVersion:index?.version||0,drawStart:draw.start,drawCount:draw.count,materialVisibility,indices});return indices;
}

/** Call after the mixer updates, only for standing/walking characters.
 * floorY is world-space. Returns the applied world-space vertical correction.
 * Riding, swimming and reveal scaling must be excluded by the caller.
 */
export function groundCharacter(root,floorY=0){
 if(!root||!Number.isFinite(floorY)||!root.visible)return 0;
 root.updateWorldMatrix(true,false);root.updateMatrixWorld(true);let minY=Infinity,samples=0;
 root.traverseVisible(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.attributes.position||typeof mesh.getVertexPosition!=='function')return;
  const indices=sampleIndices(mesh,root);
  for(const i of indices){mesh.getVertexPosition(i,point);point.applyMatrix4(mesh.matrixWorld);if(Number.isFinite(point.y)){minY=Math.min(minY,point.y);samples++;}}
 });
 if(!Number.isFinite(minY))return 0;
 const correction=floorY-minY;
 if(Math.abs(correction)>1e-6){
  root.getWorldPosition(worldPosition);worldPosition.y+=correction;
  if(root.parent)root.parent.worldToLocal(worldPosition);
  root.position.copy(worldPosition);root.updateMatrixWorld(true);
 }
 root.userData.grounding={sampleCount:samples,minimumBefore:minY,minimumAfter:minY+correction,correction,floorY};
 return correction;
}
