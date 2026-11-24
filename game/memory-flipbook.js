import {memoryArt} from './story-flow.js';
/** Illustrated comic leaves open a memory; original photos live in the library. */
export function createMemoryFlipbook(container,{onComplete=()=>{}}={}){
 const style=document.createElement('style');style.textContent=`
 .memory-book{position:fixed;inset:0;z-index:85;display:none;place-items:center;background:#102b32;perspective:1500px;overflow:hidden;color:#fff1cc}
 .memory-book:before{content:'';position:absolute;inset:-50%;background:repeating-conic-gradient(from 12deg,#23464b35 0deg 3deg,transparent 3deg 15deg);animation:memory-rays 80s linear infinite}
 .memory-leaves{width:min(80vw,1000px);height:min(64vh,620px);position:relative;transform:rotate(-2deg)}
 .memory-leaf{position:absolute;inset:0;border:4px solid #182c31;background:#f7dfa8;box-shadow:8px 9px 0 #071b24,12px 13px 0 #e3ad5c;overflow:hidden;transform-origin:left center;backface-visibility:hidden}
 .memory-leaf img{width:100%;height:100%;object-fit:cover}.memory-leaf:after{content:'';position:absolute;inset:0;box-shadow:inset 0 0 50px #052e3333;pointer-events:none}
 .memory-book-caption{position:absolute;bottom:4%;left:8%;right:8%;text-align:center;text-shadow:3px 3px #0c2026;font-family:Impact,'Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.04em;font-size:clamp(25px,4vw,46px)}
 .memory-book-caption small{display:block;color:#f7c75e;font:700 11px system-ui;letter-spacing:.2em;margin-bottom:5px}
 .memory-book-enter{position:absolute;right:25px;top:23px;background:#ffd56e;color:#152d36;border:3px solid #152d36;padding:10px 18px;box-shadow:3px 3px 0 #061c22;font-weight:850;cursor:pointer;transform:rotate(1deg)}
 @keyframes memory-rays{to{transform:rotate(360deg)}}@media(max-width:600px){.memory-leaves{width:90vw;height:56vh}.memory-book-caption{bottom:9%}.memory-book-enter{top:15px;right:15px}}
 @media(prefers-reduced-motion:reduce){.memory-book:before{animation:none}}`;
 const root=document.createElement('div');root.className='memory-book';root.setAttribute('role','region');root.setAttribute('aria-label','Illustrated memory flip-book');
 const book=document.createElement('div');book.className='memory-leaves';const caption=document.createElement('div');caption.className='memory-book-caption';
 const skip=document.createElement('button');skip.textContent='Enter memory →';skip.className='memory-book-enter';skip.setAttribute('aria-label','Enter memory');root.append(book,caption,skip);container.append(style,root);
 let timer=0,animations=[],resolveStart=null,running=false,disposed=false,generation=0;
 function finish(){if(!running||disposed)return;running=false;clearTimeout(timer);animations.forEach(a=>a.cancel());animations=[];root.style.display='none';const resolve=resolveStart;resolveStart=null;resolve?.();onComplete();}
 function start({title='Our next adventure',occasion='',images=[],chapter='home'}={}){
  if(disposed)return Promise.resolve();if(running)finish();const token=++generation;running=true;book.replaceChildren();caption.replaceChildren();root.style.display='grid';
  const small=document.createElement('small');small.textContent=occasion+' · MEMORY UNLOCK';const heading=document.createElement('div');heading.textContent=title;caption.append(small,heading);
  const result=new Promise(resolve=>resolveStart=resolve),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const source=memoryArt(chapter),preload=new Image();
  const ready=()=>{if(!running||token!==generation)return;
   for(let i=0;i<3;i++){
    const page=document.createElement('div');page.className='memory-leaf';page.style.zIndex=4-i;
    const img=new Image();img.src=preload.src;img.alt=i===2?title+' — illustrated SUMO and BUMO memory':'';if(i===1){img.style.transform='scale(1.3)';img.style.objectPosition='55% 40%';}page.append(img);book.append(page);
    if(!reduced&&i<2)animations.push(page.animate([{transform:'rotateY(0)'},{transform:'rotateY(-70deg)',offset:.55},{transform:'rotateY(-172deg)'}],{duration:650,delay:650+i*950,easing:'cubic-bezier(.45,.05,.45,1)',fill:'forwards'}));
   }
   timer=setTimeout(()=>{if(token===generation)finish();},reduced?1400:3900);
  };
  preload.onload=ready;preload.onerror=()=>{preload.onerror=null;preload.onload=ready;preload.src=images[0]||'assets/comic/page-03.jpg';};preload.src=source;
  return result;
 }
 skip.addEventListener('click',finish);
 return {start,skip:finish,dispose(){disposed=true;running=false;generation++;clearTimeout(timer);animations.forEach(a=>a.cancel());resolveStart?.();root.remove();style.remove();}};
}
