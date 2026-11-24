import * as T from 'three';
// The keepsake characters are static meshes. Give their legs a seated shape for
// transport without changing the source GLBs or pretending they have an animation rig.
export function prepareSeatedPose(root,height){
 root.updateMatrixWorld(true);
 const inverseRoot=new T.Matrix4().copy(root.matrixWorld).invert();
 const hip=height*.46,knee=height*.24;
 root.userData.seatHeight=hip;root.userData.poseMeshes=[];
 root.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry.attributes.position)return;
  mesh.geometry=mesh.geometry.clone();
  const standing=mesh.geometry.attributes.position.clone(),seated=standing.clone();
  const toRoot=new T.Matrix4().multiplyMatrices(inverseRoot,mesh.matrixWorld),toMesh=toRoot.clone().invert();
  const p=new T.Vector3(),q=new T.Vector3();
  for(let i=0;i<standing.count;i++){
   p.fromBufferAttribute(standing,i).applyMatrix4(toRoot);q.copy(p);
   if(p.y<hip){
    const amount=T.MathUtils.smoothstep(hip-p.y,0,height*.065);
    if(p.y>=knee){q.y=hip-p.z;q.z=hip-p.y;}
    else{q.y=hip-(knee-p.y);q.z=hip-knee+p.z;}
    q.lerpVectors(p,q,amount);
   }
   q.applyMatrix4(toMesh);seated.setXYZ(i,q.x,q.y,q.z);
  }
  const normals=mesh.geometry.attributes.normal?.clone();
  mesh.geometry.setAttribute('position',seated);mesh.geometry.computeVertexNormals();
  const seatedNormals=mesh.geometry.attributes.normal.clone();
  mesh.geometry.setAttribute('position',standing);if(normals)mesh.geometry.setAttribute('normal',normals);
  root.userData.poseMeshes.push({mesh,standing,seated,normals,seatedNormals});
 });
 root.userData.seated=false;
}
export function setSeatedPose(root,on){
 if(root.userData.seated===on)return;
 for(const p of root.userData.poseMeshes){
  p.mesh.geometry.setAttribute('position',on?p.seated:p.standing);
  p.mesh.geometry.setAttribute('normal',on?p.seatedNormals:p.normals);
  p.mesh.geometry.computeBoundingBox();p.mesh.geometry.computeBoundingSphere();
 }
 root.userData.seated=on;
}
