// XZ capsules include the full vehicle body, not just its centre point.
function pointDistance(p,a,b){const x=b[0]-a[0],z=b[1]-a[1],l=x*x+z*z,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*z)/l)):0;return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*z);}
export function segmentDistance(a,b,c,d){
 const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
 if(abC*abD<0&&cdA*cdB<0)return 0;
 return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));
}
export function vehicleCapsule(p,extent){return {a:[p.x+p.dx*extent.minZ,p.z+p.dz*extent.minZ],b:[p.x+p.dx*extent.maxZ,p.z+p.dz*extent.maxZ],radius:extent.radius};}
export function capsuleBlocked(body,obstacles,margin=.3){return obstacles.some(o=>segmentDistance(body.a,body.b,o.a||[o.x,o.z],o.b||o.a||[o.x,o.z])<=body.radius+(o.radius||0)+margin);}
export function sweptVehicleClear(sample,from,to,extent,obstacles){
 const steps=Math.max(1,Math.ceil(Math.abs(to-from)/.08));
 for(let i=0;i<=steps;i++)if(capsuleBlocked(vehicleCapsule(sample(from+(to-from)*i/steps),extent),obstacles))return false;
 return true;
}
export function pathReservations(paths,radii=[.85,1]){return paths.flatMap((path,index)=>path.slice(1).map((b,i)=>({a:path[i],b,radius:radii[index]??1})));}
