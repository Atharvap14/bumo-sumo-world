// Deterministic stage blocking. Only authored destinations are accepted; there
// is no keyboard/free-ground navigation. Swept circles guard every movement.
export function createColliders(collisions,bounds){
 function inside(x,z,p){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
 function distance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/l)):0;return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
 const polygons=collisions.map(c=>c.polygon||[[c.x-c.w/2,c.z-c.d/2],[c.x+c.w/2,c.z-c.d/2],[c.x+c.w/2,c.z+c.d/2],[c.x-c.w/2,c.z+c.d/2]]);
 function blocked(p,r=.34){const [x,z]=p;if(bounds&&(x<bounds.minX+r||x>bounds.maxX-r||z<bounds.minZ+r||z>bounds.maxZ-r))return true;return polygons.some(poly=>inside(x,z,poly)||poly.some((a,i)=>distance(x,z,a,poly[(i+1)%poly.length])<r));}
 function clear(a,b,r=.34){const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1));for(let i=0;i<=count;i++){const t=i/count;if(blocked([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],r))return false;}return true;}
 function safe(p,r=.34){if(!blocked(p,r))return p;for(let radius=.25;radius<3;radius+=.25)for(let a=0;a<16;a++){const q=[p[0]+Math.cos(a*Math.PI/8)*radius,p[1]+Math.sin(a*Math.PI/8)*radius];if(!blocked(q,r))return q;}throw new Error('No safe stage position');}
 function path(a,b,r=.34){a=safe(a,r);b=safe(b,r);if(clear(a,b,r))return [a,b];
 const step=.4,minX=Math.min(a[0],b[0])-5,minZ=Math.min(a[1],b[1])-5,maxX=Math.max(a[0],b[0])+5,maxZ=Math.max(a[1],b[1])+5;
 const key=(x,z)=>x+','+z,point=(x,z)=>[minX+x*step,minZ+z*step],target=[Math.round((b[0]-minX)/step),Math.round((b[1]-minZ)/step)],first=[Math.round((a[0]-minX)/step),Math.round((a[1]-minZ)/step)];
 const start={x:first[0],z:first[1],g:0,parent:null},open=[start],seen=new Map([[key(...first),start]]);let found;
 while(open.length){open.sort((u,v)=>(u.g+Math.hypot(u.x-target[0],u.z-target[1]))-(v.g+Math.hypot(v.x-target[0],v.z-target[1])));const cur=open.shift();if(cur.closed)continue;cur.closed=true;const cp=point(cur.x,cur.z);if(Math.hypot(cp[0]-b[0],cp[1]-b[1])<step*1.5&&clear(cp,b,r)){found=cur;break;}
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=cur.x+dx,z=cur.z+dz,np=point(x,z);if(np[0]<minX||np[0]>maxX||np[1]<minZ||np[1]>maxZ||!clear(cp,np,r))continue;const k=key(x,z),g=cur.g+Math.hypot(dx,dz),old=seen.get(k);if(old&&old.g<=g)continue;const next={x,z,g,parent:cur};seen.set(k,next);open.push(next);}}
 if(!found)throw new Error('Authored entrance is obstructed');const points=[b];for(let v=found;v;v=v.parent)points.unshift(point(v.x,v.z));points.unshift(a);const result=[a];for(let i=1;i<points.length;){let j=points.length-1;while(j>i&&!clear(result.at(-1),points[j],r))j--;result.push(points[j]);i=j+1;}return result;}
 return {blocked,clear,path,safe,polygons};
}
export function createChapterMotion(colliders){
 let playing=false,elapsed=0,duration=0,actors=[],onComplete=()=>{};
 function follow(points,t){const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0);let d=Math.min(t,1)*total;for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const u=lengths[i]?d/lengths[i]:1,a=points[i],b=points[i+1];return {x:a[0]+(b[0]-a[0])*u,z:a[1]+(b[1]-a[1])*u,heading:Math.atan2(b[0]-a[0],b[1]-a[1]),length:total};}d-=lengths[i];}return {x:points[0][0],z:points[0][1],heading:0,length:0};}
 function start(stop,{bumo,sumo,complete=()=>{}}){
 const slots=[{root:bumo,r:.33,end:[stop.x,stop.z],start:[stop.x-4.6,stop.z+.65]},{root:sumo,r:.43,end:[stop.x-1.5,stop.z-.18],start:[stop.x-6.1,stop.z+.47]}];
 actors=slots.map(s=>{const points=colliders.path(s.start,s.end,s.r);return {...s,points,length:follow(points,0).length};});duration=Math.max(...actors.map(a=>a.length))/1.05;elapsed=0;playing=true;onComplete=complete;
 for(const a of actors){const p=follow(a.points,0);a.root.position.set(p.x,.06,p.z);a.root.rotation.y=p.heading;}return duration;
 }
 function update(dt,paused=false){if(!playing||paused)return false;elapsed=Math.min(duration,elapsed+dt);const t=elapsed/duration;
 for(const a of actors){const p=follow(a.points,t),from=[a.root.position.x,a.root.position.z],to=[p.x,p.z];if(!colliders.clear(from,to,a.r)){playing=false;throw new Error('Movement stopped by stage collider');}a.root.position.set(p.x,.06,p.z);const delta=Math.atan2(Math.sin(p.heading-a.root.rotation.y),Math.cos(p.heading-a.root.rotation.y));a.root.rotation.y+=delta*Math.min(1,dt*10);}
 if(t>=1){playing=false;onComplete();}return playing;
 }
 return {start,update,stop(){playing=false;},get playing(){return playing;},get paths(){return actors.map(a=>a.points);},get speed(){return 1.05;}};
}
