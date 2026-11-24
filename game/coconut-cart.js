import * as T from 'three';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {box,ball,cylinder,mesh} from './world.js';
// Local front +Z. A remembered coconut stall, not a likeness of the real seller.
export function coconutCart(){
 const p=new T.Group(),out=new T.Group();out.name='Nariyal paani cart and seller';
 const steel=0x5c6762,wood=0x92704b,blue=0x427b7b,skin=0x986644,shirt=0xe4d7b6,pants=0x505b55;
 const rod=(a,b,r,c)=>{const va=new T.Vector3(...a),vb=new T.Vector3(...b),d=vb.clone().sub(va),m=cylinder(p,r,r,d.length(),c,...va.add(vb).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;};
 box(p,2.5,.09,1.22,wood,0,1.04,0);for(let i=0;i<9;i++)box(p,.265,.055,1.2,i%3?wood:0xb09365,-1.12+i*.28,1.105,0);
 for(const z of [-.55,.55]){box(p,2.42,.085,.08,steel,0,.65,z);for(let i=0;i<10;i++)box(p,.21,.37,.055,i%3?blue:0x65928a,-1.08+i*.24,.84,z);}
 for(const x of [-1.2,1.2]){box(p,.07,.42,1.13,blue,x,.86,0);rod([x,.64,-.5],[x,.64,-1.3],.035,steel);ball(p,.05,0x403b31,x,.64,-1.32,[1.2,1.1,2]);}
 rod([-1.4,.44,0],[1.4,.44,0],.05,steel);
 for(const x of [-1.33,1.33]){let m=mesh(p,new T.TorusGeometry(.4,.055,8,32),0x292c28,x,.45,0);m.rotation.y=Math.PI/2;m=mesh(p,new T.TorusGeometry(.355,.018,6,32),0xadb1a1,x,.45,0);m.rotation.y=Math.PI/2;for(let i=0;i<16;i++){const a=i*Math.PI/8;rod([x,.45,0],[x,.45+Math.sin(a)*.35,Math.cos(a)*.35],.006,0x8f9b92);}m=cylinder(p,.06,.06,.15,steel,x,.45,0);m.rotation.z=Math.PI/2;}
 for(const x of [-.95,.95])rod([x,.65,-.47],[x,.08,-.73],.028,steel);
 // Woven basket brimming with irregular green coconuts.
 for(let i=0;i<6;i++){const y=1.12+i*.035;for(const z of [-.43,.48])rod([-1.12,y,z],[.38,y,z],.012,0xb49a61);for(const x of [-1.12,.38])rod([x,y,-.43],[x,y,.48],.012,0xb49a61);}
 for(let x=-1.1;x<.4;x+=.12)for(const z of [-.43,.48])rod([x,1.1,z],[x,1.34,z],.009,0x8e7749);
 const colors=[0x93a84f,0xa6b45c,0x768e42,0xb2ae64],geo=new T.SphereGeometry(1,14,10),v=geo.attributes.position;
 for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i),z=v.getZ(i),n=1+.035*Math.sin(x*7+y*5)*Math.cos(z*6),t=1-.12*Math.max(0,y);v.setXYZ(i,x*n*t,y*n,z*n*t);}geo.computeVertexNormals();
 const coconut=(x,y,z,r,i)=>{const m=mesh(p,geo.clone(),colors[i%4],x,y,z);m.scale.set(r*.97,r*1.12,r);m.rotation.set((i%3)*.22,i*1.3,(i%2?1:-1)*.18);rod([x,y+r*.9,z],[x+.025,y+r*1.14,z-.01],.018,0x776b3c);ball(p,r*.3,0x9c9853,x+r*.55,y+r*.45,z+r*.55,[.8,.3,1]);};
 let n=0;for(let layer=0;layer<3;layer++)for(let row=0;row<3-layer;row++)for(let col=0;col<4-layer;col++)coconut(-.94+col*.34+layer*.13,1.3+layer*.27,-.28+row*.32,.205,n++);
 for(let i=0;i<6;i++)coconut(-.85+(i%3)*.35,.64,i<3?-.2:.22,.19,n++);
 // Cut tender coconuts, straws, chopping block and husks.
 cylinder(p,.25,.26,.09,0x71543a,.78,1.18,.08);
 for(const [x,z] of [[.8,.18],[.56,.45]]){cylinder(p,.115,.19,.22,0xa4b15e,x,1.33,z);cylinder(p,.13,.117,.12,0xe5d4aa,x,1.49,z);cylinder(p,.052,.052,.008,0x665835,x,1.555,z);rod([x+.015,1.52,z],[x+.04,1.9,z+.025],.012,0xf0e3b8);rod([x+.04,1.9,z+.025],[x+.13,1.92,z+.04],.012,0xf0e3b8);}
 cylinder(p,.09,.075,.19,0x9aab94,1.05,1.23,-.25);for(let i=0;i<6;i++)rod([1.03+i*.012,1.22,-.25],[1.04+i*.009,1.6,-.24],.006,0xe6cf92);
 cylinder(p,.26,.2,.48,0x5e8b8b,1.03,.26,-.66);const rim=mesh(p,new T.TorusGeometry(.26,.018,6,24),steel,1.03,.51,-.66);rim.rotation.x=Math.PI/2;
 for(let i=0;i<9;i++){const m=ball(p,.13,i%2?0xc1b17b:0x9ca159,.55+(i%3)*.2,.08,.73+Math.floor(i/3)*.16,[1,.22,1.5]);m.rotation.y=i*1.7;}
 // Adult seller in a folded-sleeve cotton shirt, trousers and sandals.
 const x=.58,z=-.82;
 for(const xx of [x-.105,x+.105]){rod([xx,.16,z],[xx,.74,z+.025],.085,pants);ball(p,.11,0x423f34,xx,.09,z+.08,[.85,.5,1.65]);box(p,.17,.035,.07,0x786649,xx,.14,z+.12);}
 ball(p,.25,pants,x,.77,z,[.79,.7,.6]);const torso=mesh(p,new T.LatheGeometry([new T.Vector2(.16,0),new T.Vector2(.19,.1),new T.Vector2(.23,.34),new T.Vector2(.19,.45),new T.Vector2(.1,.48)],20),shirt,x,.83,z);torso.scale.z=.67;
 cylinder(p,.065,.075,.14,skin,x,1.35,z);const head=ball(p,.15,skin,x,1.52,z+.025,[.86,1.17,.9]);head.rotation.x=.13;
 const hair=mesh(p,new T.SphereGeometry(.152,18,12,0,Math.PI*2,0,Math.PI*.52),0x39362e,x,1.565,z);hair.scale.set(.91,.83,.93);hair.rotation.x=.13;
 for(const xx of [x-.13,x+.13])ball(p,.032,skin,xx,1.51,z+.02,[.65,1,.7]);for(const xx of [x-.048,x+.048]){ball(p,.012,0x352f26,xx,1.535,z+.143,[1,.55,.35]);rod([xx-.02,1.56,z+.137],[xx+.02,1.557,z+.137],.006,0x3f382c);}
 ball(p,.026,skin,x,1.5,z+.16,[.55,1,1]);ball(p,.039,0x4c3a2b,x,1.466,z+.145,[1,.25,.2]);
 for(const sign of [-1,1]){const c=box(p,.095,.09,.025,0xf1e5c9,x+sign*.06,1.285,z+.135);c.rotation.z=sign*.45;}
 rod([x,1.25,z+.155],[x,.88,z+.12],.007,0xbcb293);for(let i=0;i<4;i++)ball(p,.009,0x867f65,x,1.22-i*.08,z+.159);box(p,.1,.105,.012,0xd4c7a6,x-.11,1.14,z+.15);
 for(const [a,b,c] of [[[x-.2,1.22,z],[x-.32,1.02,z+.2],[.47,1.2,-.24]],[[x+.2,1.22,z],[x+.35,1.04,z+.2],[.87,1.23,-.2]]]){rod(a,b,.073,shirt);ball(p,.077,shirt,...b,[1,.55,1]);rod(b,c,.046,skin);ball(p,.055,skin,...c,[.75,.7,1.25]);}coconut(.68,1.24,-.22,.17,n++);
 // Striped shade cloth sags between rails; scalloped valance faces the road.
 for(const xx of [-1.35,1.35])rod([xx,.65,-.52],[xx,2.65,-.52],.025,steel);rod([-1.47,2.64,-.9],[1.47,2.64,-.9],.025,steel);rod([-1.47,2.47,1.05],[1.47,2.47,1.05],.025,steel);
 for(let i=0;i<12;i++){const xx=-1.5+i*.25,verts=[],ind=[],color=i%2?0xe8d9ac:0x507c58;for(let k=0;k<=8;k++){const zz=-.95+k*.25,yy=2.65-k*.022-Math.sin(k*Math.PI/8)*.06;verts.push(xx,yy,zz,xx+.25,yy,zz);if(k){const q=k*2;ind.push(q-2,q,q-1,q-1,q,q+1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(new Array(36).fill(0),2));g.setIndex(ind);g.computeVertexNormals();p.add(new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.94,side:T.DoubleSide})));box(p,.25,.18,.035,color,xx+.125,2.37,1.05);ball(p,.124,color,xx+.125,2.29,1.05,[1,.34,.14]);}
 p.updateMatrixWorld(true);const batches=new Map();p.traverse(m=>{if(!m.isMesh)return;const key=`${m.material.color.getHex()}-${m.material.side}-${m.material.roughness}`;let g=m.geometry.clone().applyMatrix4(m.matrixWorld);if(g.index)g=g.toNonIndexed();if(!batches.has(key))batches.set(key,{material:m.material,geos:[]});batches.get(key).geos.push(g);});
 for(const {material,geos} of batches.values()){const m=new T.Mesh(mergeGeometries(geos,false),material);m.castShadow=true;m.receiveShadow=true;out.add(m);geos.forEach(g=>g.dispose());}
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=640;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#244e3b';ctx.fillRect(0,0,640,160);ctx.strokeStyle='#d7c58d';ctx.lineWidth=7;ctx.strokeRect(9,9,622,142);ctx.fillStyle='#fff0bf';ctx.textAlign='center';ctx.font='bold 49px sans-serif';ctx.fillText('NARIYAL PAANI',320,73);ctx.font='25px sans-serif';ctx.fillText('Fresh tender coconut',320,119);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(1.75,.438),new T.MeshStandardMaterial({map:tex,roughness:.9}));sign.position.set(0,.86,.585);out.add(sign);}
 out.userData={front:'+Z',vendorPosition:[x,0,z],approximateFootprint:[3,2.5],height:2.7,coconutCount:n,interpretation:'Illustrative vendor and cart based on the remembered morning stop; not a portrait of the actual seller.'};return out;
}
