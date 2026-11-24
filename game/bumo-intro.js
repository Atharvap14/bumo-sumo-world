const STYLE_ID='bumo-cinema-style';
const stylesheet=`
.bumo-cinema{position:absolute;inset:0;z-index:8;background:#4b0715;overflow:hidden;isolation:isolate}
.bumo-cinema canvas{display:block;width:100%;height:100%}
.bumo-cinema-skip{position:absolute;right:max(24px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom));z-index:3;border:1px solid #fff6;border-radius:30px;padding:11px 19px;color:#fff5e7;background:#31071299;font:13px system-ui;letter-spacing:.04em;cursor:pointer}
.bumo-cinema-skip:hover{background:#69172b}.bumo-cinema-skip:focus-visible{outline:3px solid #ffe0ab;outline-offset:5px}
.bumo-cinema-status{position:absolute;left:24px;bottom:28px;color:#ffe4cb;font:11px system-ui;letter-spacing:.16em;text-transform:uppercase}
@media(max-width:600px){.bumo-cinema-skip{right:16px;bottom:20px}.bumo-cinema-status{left:16px;font-size:9px;max-width:45%}}
`;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const clamp=t=>Math.max(0,Math.min(1,t));

/** Animated, canvas-clipped comic studio opener. No soundtrack is bundled.
 * start() starts a fresh 11.2-second sequence; skip() completes it once.
 * dispose() cancels all work and removes its DOM. onComplete fires on finish/skip.
 */
export function createBumoIntro(container,{onComplete=()=>{}}={}){
 if(!container)throw new Error('BUMO intro needs a container');
 if(!document.getElementById(STYLE_ID)){const style=document.createElement('style');style.id=STYLE_ID;style.textContent=stylesheet;document.head.append(style);}
 const root=document.createElement('div');root.className='bumo-cinema';root.setAttribute('role','region');root.setAttribute('aria-label','BUMO Studios: our comic memories become a cinematic logo');
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false}),layer=document.createElement('canvas'),lc=layer.getContext('2d'),panels=document.createElement('canvas'),pc=panels.getContext('2d');
 const skipButton=document.createElement('button');skipButton.className='bumo-cinema-skip';skipButton.type='button';skipButton.textContent='Skip intro';skipButton.setAttribute('aria-label','Skip BUMO Studios introduction');
 const status=document.createElement('div');status.className='bumo-cinema-status';status.setAttribute('role','status');status.textContent='Opening our comic universe…';
 root.append(canvas,status,skipButton);container.replaceChildren(root);
 let width=1,height=1,scale=1,raf=0,startedAt=0,running=false,disposed=false,completed=false,generation=0;
 const images=[];
 const ready=Promise.all([1,3,5,7,10,13].map(number=>new Promise(resolve=>{const img=new Image();img.onload=()=>{images.push(img);resolve();};img.onerror=resolve;img.src=new URL(`../assets/comic/page-${String(number).padStart(2,'0')}.jpg`,import.meta.url).href;})));
 function resize(){if(disposed)return;const rect=container.getBoundingClientRect();width=Math.max(1,rect.width||innerWidth);height=Math.max(1,rect.height||innerHeight);scale=Math.min(devicePixelRatio||1,1.5);for(const c of [canvas,layer,panels]){c.width=Math.round(width*scale);c.height=Math.round(height*scale);}ctx.setTransform(scale,0,0,scale,0,0);lc.setTransform(scale,0,0,scale,0,0);if(!running)draw(11.1);}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function cover(context,img,x,y,w,h,pan=0){const aspect=img.width/img.height;let dw=w,dh=w/aspect;if(dh<h){dh=h;dw=h*aspect;}context.drawImage(img,x+(w-dw)/2,y+(h-dh)/2+pan*Math.max(0,dh-h)*.35,dw,dh);}
 function comics(context,t){
  context.fillStyle='#f4dcb2';context.fillRect(0,0,width,height);
  if(!images.length){context.fillStyle='#91243c';context.fillRect(0,0,width,height);context.strokeStyle='#d9af79';context.lineWidth=4;for(let i=-2;i<9;i++){context.beginPath();context.moveTo(i*width/6,0);context.lineTo(i*width/6-height*.25,height);context.stroke();}return;}
  const panelW=width/3.2,panelH=height*.86,drift=(t*width*.09)%panelW;
  context.save();context.translate(width/2,height/2);context.rotate(-.075);context.translate(-width/2,-height/2);
  for(let row=-1;row<3;row++)for(let col=-2;col<6;col++){
   const x=col*panelW-drift,y=row*panelH-(t*height*.035)%panelH;
   const phase=t*1.4+col*.42+row*.7,cycle=Math.floor(phase),flip=Math.cos((phase-cycle)*Math.PI),squash=Math.max(.035,Math.abs(flip));
   const index=((col+row*3+cycle)%images.length+images.length)%images.length;
   context.save();context.translate(x+panelW/2,y+panelH/2);context.scale(squash,1);context.beginPath();context.rect(-panelW/2+5,-panelH/2+5,panelW-10,panelH-10);context.clip();cover(context,images[index],-panelW/2,-panelH/2,panelW,panelH,Math.sin(phase));
   context.fillStyle=`rgba(35,7,20,${(1-squash)*.52})`;context.fillRect(-panelW/2,-panelH/2,panelW,panelH);context.restore();
  }
  context.restore();
 }
 function logoFont(){let size=Math.min(width*.30,height*.46);lc.font=`900 ${size}px Impact, "Arial Black", sans-serif`;const actual=lc.measureText('BUMO').width;size*=width*.8/actual;return Math.min(size,height*.52);}
 function draw(t){
  ctx.setTransform(scale,0,0,scale,0,0);const bg=ctx.createRadialGradient(width*.5,height*.45,0,width*.5,height*.5,Math.max(width,height)*.7);bg.addColorStop(0,'#a4243c');bg.addColorStop(.55,'#731329');bg.addColorStop(1,'#280612');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
  const reducedMotion=reduced.matches;
  if(!reducedMotion&&t<3.1){ctx.save();ctx.globalAlpha=1-smooth((t-2.6)/.5);comics(ctx,t);ctx.restore();}
  const font=logoFont(),cy=height*.43;
  lc.setTransform(scale,0,0,scale,0,0);lc.clearRect(0,0,width,height);lc.font=`900 ${font}px Impact, "Arial Black", sans-serif`;lc.textAlign='center';lc.textBaseline='middle';
  const metallic=lc.createLinearGradient(0,cy-font*.5,0,cy+font*.55);metallic.addColorStop(0,'#ffffff');metallic.addColorStop(.32,'#fff8ed');metallic.addColorStop(.52,'#bdc5cb');metallic.addColorStop(.58,'#f5f1e8');metallic.addColorStop(1,'#d7d4cc');lc.fillStyle=metallic;lc.fillText('BUMO',width/2,cy);
  const settle=smooth((t-7.2)/1.8);
  if(settle<1&&!reducedMotion){pc.setTransform(scale,0,0,scale,0,0);comics(pc,t+1.8);lc.globalCompositeOperation='source-in';lc.drawImage(panels,0,0,panels.width,panels.height,0,0,width,height);lc.globalCompositeOperation='source-over';if(settle>0){lc.globalAlpha=settle;lc.fillStyle=metallic;lc.fillText('BUMO',width/2,cy);lc.globalAlpha=1;}}
  const pull=reducedMotion?1:smooth((t-2.4)/4.9),zoom=1+9*Math.pow(1-pull,3);
  ctx.save();ctx.translate(width/2,height*.43);ctx.scale(zoom,zoom);ctx.translate(-width/2,-height*.43);ctx.globalAlpha=reducedMotion?1:smooth((t-2.5)/.55);
  ctx.shadowColor='#190610';ctx.shadowBlur=10;ctx.shadowOffsetY=4;ctx.drawImage(layer,0,0,layer.width,layer.height,0,0,width,height);ctx.restore();
  const subtitle=reducedMotion?1:smooth((t-7.1)/1.4);if(subtitle>0){
   ctx.save();ctx.globalAlpha=subtitle;ctx.fillStyle='#fff0d9';ctx.textAlign='center';ctx.textBaseline='middle';const size=Math.min(width*.043,32);ctx.font=`500 ${size}px system-ui`;ctx.fillText('S T U D I O S',width/2,cy+font*.64);const lineWidth=Math.min(width*.34,330);ctx.fillRect((width-lineWidth)/2,cy+font*.49,lineWidth,1.5);ctx.fillRect((width-lineWidth)/2,cy+font*.79,lineWidth,1.5);ctx.font=`500 ${Math.max(8,Math.min(width*.012,12))}px system-ui`;ctx.globalAlpha*=smooth((t-8.5)/1.1);ctx.fillText('EVERY UNIVERSE. STILL YOU.',width/2,cy+font*.96);ctx.restore();
  }
 }
 function finish(){if(disposed||completed)return;completed=true;running=false;cancelAnimationFrame(raf);status.textContent='';onComplete();}
 function tick(now){if(disposed||!running)return;const elapsed=(now-startedAt)/1000;draw(reduced.matches?11.1:elapsed);if(elapsed>=(reduced.matches?1.6:11.2))finish();else raf=requestAnimationFrame(tick);}
 async function start(){if(disposed)return;const token=++generation;cancelAnimationFrame(raf);running=false;completed=false;container.classList.remove('hidden');status.textContent='Opening our comic universe…';resize();draw(0);await Promise.race([ready,new Promise(resolve=>setTimeout(resolve,4000))]);if(disposed||completed||token!==generation)return;status.textContent='';running=true;startedAt=performance.now();raf=requestAnimationFrame(tick);}
 function skip(){generation++;finish();}
 function dispose(){if(disposed)return;disposed=true;running=false;generation++;cancelAnimationFrame(raf);resizeObserver.disconnect();skipButton.removeEventListener('click',skip);root.remove();}
 skipButton.addEventListener('click',skip);resize();
 return {start,skip,dispose};
}
