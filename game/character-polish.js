import * as T from 'three';

/** A small ground-plane shadow. Keep it under the character, not parented to its bobbing root. */
export function contactShadow(parent,{radius=.8,opacity=.42,color=0x26382e}={}){
 const material=new T.ShaderMaterial({
  uniforms:{shadowColor:{value:new T.Color(color)},strength:{value:opacity}},
  vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 shadowColor; uniform float strength; varying vec2 vUv; void main(){float r=length((vUv-.5)*2.0);float a=pow(max(0.0,1.0-r),1.8)*strength;gl_FragColor=vec4(shadowColor,a);}',
  transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false
 });
 const mesh=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),material);mesh.name='Soft character contact shadow';mesh.rotation.x=-Math.PI/2;mesh.position.y=.041;mesh.renderOrder=2;parent.add(mesh);return mesh;
}

/**
 * A restrained static arm relaxation for the two normalized keepsake meshes.
 * Apply after fitting height, before preparing seated poses. It changes only
 * outer arm vertices below shoulder level and leaves the source GLBs untouched.
 */
export function relaxArms(root,height,{build='slim',angle=.18}={}){
 if(root.userData.armsRelaxed)return;
 root.updateMatrixWorld(true);const inverseRoot=new T.Matrix4().copy(root.matrixWorld).invert();
 const broad=build==='broad',inner=(broad?.205:.155)*height,outer=(broad?.285:.245)*height,pivotX=(broad?.18:.135)*height,pivotY=height*.66;
 root.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
  mesh.geometry=mesh.geometry.clone();const pos=mesh.geometry.attributes.position,toRoot=new T.Matrix4().multiplyMatrices(inverseRoot,mesh.matrixWorld),toLocal=toRoot.clone().invert(),point=new T.Vector3();let changed=false;
  for(let i=0;i<pos.count;i++){
   point.fromBufferAttribute(pos,i).applyMatrix4(toRoot);
   const weight=T.MathUtils.smoothstep(Math.abs(point.x),inner,outer)*T.MathUtils.smoothstep(point.y,height*.31,height*.41)*(1-T.MathUtils.smoothstep(point.y,height*.63,height*.71));
   if(weight<.00001)continue;
   const side=Math.sign(point.x),theta=-side*angle*weight,dx=point.x-side*pivotX,dy=point.y-pivotY,c=Math.cos(theta),s=Math.sin(theta);
   point.x=side*pivotX+dx*c-dy*s;point.y=pivotY+dx*s+dy*c;point.applyMatrix4(toLocal);pos.setXYZ(i,point.x,point.y,point.z);changed=true;
  }
  if(changed){pos.needsUpdate=true;mesh.geometry.computeVertexNormals();if(mesh.geometry.attributes.tangent&&mesh.geometry.attributes.uv&&mesh.geometry.index)mesh.geometry.computeTangents();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
 });
 root.userData.armsRelaxed=true;
}
