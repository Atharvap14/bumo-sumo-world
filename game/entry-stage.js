import * as T from 'three';
export function createEntryStage(stage,n){
 const root=new T.Group();root.name='Title scene props';stage.add(root);
 const bike=n.bike.clone(true);bike.position.set(3.4,0,-.35);bike.rotation.y=-.65;root.add(bike);
 const floor=new T.Mesh(new T.PlaneGeometry(30,24),new T.ShadowMaterial({opacity:.28}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;root.add(floor);
 const glow=new T.PointLight(0xffc98c,9,12);glow.position.set(3,3,2);root.add(glow);
 const rim=new T.PointLight(0x7be2de,7,12);rim.position.set(-2,3,-2);root.add(rim);
 const points=new Float32Array(72);for(let i=0;i<24;i++)points.set([Math.sin(i*2.4)*6,.7+(i%9)*.4,-3+Math.cos(i)*1.2],i*3);
 const original=points.slice(),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(points,3));const sparks=new T.Points(geo,new T.PointsMaterial({size:.03,color:0xffdf9d,transparent:true,opacity:.8,depthWrite:false}));root.add(sparks);
 return {root,update(time){for(let i=0;i<24;i++)points[i*3+1]=original[i*3+1]+Math.sin(time*.5+i)*.14;geo.attributes.position.needsUpdate=true;}};
}
