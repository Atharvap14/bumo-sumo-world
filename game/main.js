import * as T from 'three';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {setupStorybookLighting} from './storybook-lighting.js';
import {createCompactWorld} from './compact-world.js';
import {helmet} from './world.js';
import {createColliders,createChapterMotion} from './chapter-motion.js';
import {pathReservations,capsuleBlocked} from './traffic-safety.js';
import {createBumoIntro} from './bumo-intro.js';
import {createMemoryFlipbook} from './memory-flipbook.js';
import {STORY,orderedStops,nextStoryStop,travelPlan,memoryArt} from './story-flow.js';
import {setOutfit} from './wardrobe.js';
import {groundCharacter} from './ground-characters.js';
import {contactShadow} from './character-polish.js';
import {createContinuousStage as createPaintedStage} from './continuous-stage.js';
import {createEntryStage} from './entry-stage.js';
import {createCharacterVariants} from './character-variants.js';
import {createLetters} from './letters.js';
const $=s=>document.querySelector(s),show=(s,on=true)=>$(s).classList.toggle('hidden',!on);
const renderer=new T.WebGLRenderer({canvas:$('#world'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new T.Scene();scene.background=new T.Color(0x192733);const camera=new T.OrthographicCamera(-3.4*innerWidth/innerHeight,3.4*innerWidth/innerHeight,3.4,-3.4,.1,400);camera.userData.viewHeight=6.8;camera.position.set(0,2.8,8);const stageFill=new T.HemisphereLight(0xe3effa,0x9d927f,2);scene.add(stageFill);const sun=new T.DirectionalLight(0xffdfb1,2.6);sun.position.set(-7,12,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:.1,far:150});sun.shadow.normalBias=.04;scene.add(sun,sun.target);
const stage=new T.Group();scene.add(stage);const platform=new T.Mesh(new T.CylinderGeometry(4.5,4.7,.3,80),new T.MeshStandardMaterial({color:0x2c3940,metalness:.6,roughness:.4}));platform.position.y=-.17;platform.receiveShadow=true;stage.add(platform);const stageRing=new T.Mesh(new T.TorusGeometry(3.6,.025,8,120),new T.MeshBasicMaterial({color:0xf4cd88}));stageRing.rotation.x=-Math.PI/2;stageRing.position.y=.01;stage.add(stageRing);platform.visible=false;stageRing.visible=false;
const cinematic={render(){renderer.render(scene,camera);},resize(w,h){renderer.setSize(w,h);const height=(camera.userData.viewHeight||6.4)*(w/h<1?1.15:1);camera.top=height/2;camera.bottom=-height/2;camera.left=-height*w/h/2;camera.right=height*w/h/2;camera.updateProjectionMatrix();},dispose(){renderer.dispose();}};createLetters($('#ending'));
const loader=new GLTFLoader();let n,bumo,sumo,card,particles,catalog,mode='loading',started=0,nearby=null,activeTarget=null,riding=false,walking=false,heading=0,cameraMode=0,walkTarget=null,transition=false,mediaItems=[],mediaIndex=0,currentStory=null,vehicle=null,bumoHelmet=null,parkedHelmet=null,cameraObstacles=[],worldLighting=null,lightingMood='morning',bumoShadow=null,sumoShadow=null,rideShadow=null;
let paintedStage,entryStage,titleTexture;let colliders,director,currentChapter=null,scenePaused=false,journey=null;const keys=new Set(),stick=new T.Vector2();let unlocked=new Set(),visited=new Set();try{unlocked=new Set(JSON.parse(localStorage.getItem('bumo-memories-v1')||'[]'));visited=new Set(JSON.parse(localStorage.getItem('bumo-day-v1')||'[]'));}catch{}
const music=new Audio();music.volume=.25;let musicWanted=false,musicIndex=0,videoPlaying=false;
function musicSync(){music.loop=$('#repeat').value==='track';$('#music-toggle').textContent=musicWanted?'Pause music':'Play music';if(!musicWanted||videoPlaying){music.pause();$('#audio-status').textContent=videoPlaying?'Music paused for your memory video.':'Music paused.';return;}music.play().then(()=>$('#audio-status').textContent=catalog.music.tracks[musicIndex].title).catch(e=>{if(e.name==='AbortError')return;musicWanted=false;$('#music-toggle').textContent='Play music';$('#audio-status').textContent='Press play to start your soundtrack.';});}
function loadTrack(i){musicIndex=i;music.src=catalog.music.tracks[i].src;$('#track').value=String(i);}
function clearMedia(){const v=$('#story-media video');if(v)v.pause();$('#story-media').replaceChildren();videoPlaying=false;musicSync();}
function save(){try{localStorage.setItem('bumo-memories-v1',JSON.stringify([...unlocked]));localStorage.setItem('bumo-day-v1',JSON.stringify([...visited]));}catch{}updateProgress();}
function toast(text){$('#toast').textContent=text;show('#toast');clearTimeout(toast.timer);toast.timer=setTimeout(()=>show('#toast',false),3500);}
function updateProgress(){if(!catalog)return;$('#memory-count').textContent=catalog.items.filter(i=>unlocked.has(i.collection)&&!i.duplicate_of).length;const count=n.stops.filter(s=>visited.has(s.id)).length;$('#progress-fill').style.width=count/n.stops.length*100+'%';$('#progress-text').textContent=count+' of '+n.stops.length+' memories kept';}
let worn={bumo:'casual',sumo:'casual'},bumoVariants,sumoVariants;
async function setupVariants(){
 bumoVariants=createCharacterVariants(bumo,{loader,attachments:[bumoHelmet]});sumoVariants=createCharacterVariants(sumo,{loader});
 const manifest=await fetch('character-variants.json').then(r=>{if(!r.ok)throw new Error('Wardrobe manifest unavailable');return r.json();});
 for(const [name,variants] of [['bumo',bumoVariants],['sumo',sumoVariants]])for(const [id,definition] of Object.entries(manifest[name]||{}))variants.register(id,definition);
}
async function dress(b,s){
 async function apply(actor,variants,id){if(variants?.has(id))await variants.use(id);else{await variants?.restore();setOutfit(actor,id);}}
 await Promise.all([apply(bumo,bumoVariants,b),apply(sumo,sumoVariants,s)]);
 worn={bumo:b,sumo:s};$('#world').dataset.outfits=b+','+s;$('#world').dataset.models=[bumoVariants?.current||'base',sumoVariants?.current||'base'].join(',');
}
const cue=document.createElement('div');cue.className='journey-cue';cue.hidden=true;cue.setAttribute('role','status');document.body.append(cue);
async function prepareTravel(plan){const changing=worn.bumo!==plan.bumo||worn.sumo!==plan.sumo;if(!changing&&!plan.phaseChange)return;cue.replaceChildren();const small=document.createElement('small');small.textContent='OUR BANGALORE MEMORIES';const title=document.createElement('strong');title.textContent=plan.cue;const note=document.createElement('p');note.textContent=plan.vehicle==='auto'?'Getting ready. The auto is waiting.':'A new moment. Back on our yellow scooty.';cue.append(small,title,note);cue.hidden=false;await new Promise(r=>setTimeout(r,180));await dress(plan.bumo,plan.sumo);bumoHelmet.visible=plan.vehicle==='bike';await new Promise(r=>setTimeout(r,1100));cue.hidden=true;}

const introPlayer=createBumoIntro($('#intro'),{onComplete:()=>welcome()});
const flipHost=document.createElement('div');document.body.append(flipHost);const memoryBook=createMemoryFlipbook(flipHost);
const eveningMemories=new Set(['momos','nails','falooda','waiwai','comedy','cinema']);
function setMemoryMood(stop){lightingMood=eveningMemories.has(stop.id)?'evening':'morning';worldLighting?.setMood(lightingMood);}
function targetStop(s){activeTarget=s;$('#objective').textContent=s.name;$('#objective-hint').textContent=STORY[s.id].note;$('#time').textContent=s.time;}
function makeCharacter(gltf,height,build){const body=gltf.scene;body.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(body),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Character geometry is empty');const scale=height/size.y;body.scale.setScalar(scale);body.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);body.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});const root=new T.Group();root.add(body);root.userData.body=body;root.userData.height=height;root.userData.character=build==='slim'?'bumo':'sumo';root.userData.mixer=new T.AnimationMixer(body);root.userData.actions=Object.fromEntries(gltf.animations.map(clip=>[clip.name.toLowerCase(),root.userData.mixer.clipAction(clip)]));root.userData.seatHeight=height*.37;return root;}
async function load(){try{[n,catalog]=await Promise.all([createCompactWorld(t=>$('#load-status').textContent=t),fetch('memory-library.json').then(r=>r.json())]);scene.add(n.world);n.world.visible=false;n.stops=orderedStops(n.stops);n.stops.forEach((stop,i)=>{if(stop.id==='pool')stop.collection='pool';stop.mapPosition=[stop.x,stop.z];stop.x=i*18;stop.z=0;});n.spawn.set(0,0,0);colliders=createColliders([],{minX:-100,maxX:100000,minZ:-8,maxZ:8});director=createChapterMotion(colliders);cameraObstacles=[];for(const root of n.cameraObstacles||[n.home,n.officeModel,n.restaurant].filter(Boolean)){root.traverse(object=>{if(!object.isMesh||!object.visible||!object.geometry)return;const materials=Array.isArray(object.material)?object.material:[object.material];if(materials.some(material=>material&&(!material.transparent||material.opacity>.7)))cameraObstacles.push(object);});}if(n.routeGlow)n.routeGlow.visible=false;$('#load-status').textContent='SUMO is getting ready…';const gs=await Promise.all(['bumo','sumo'].map(x=>loader.loadAsync('assets/characters/'+x+'-rigged.glb')));bumo=makeCharacter(gs[0],2.2,'slim');sumo=makeCharacter(gs[1],2.35,'broad');bumoShadow=contactShadow(scene,{radius:.72});sumoShadow=contactShadow(scene,{radius:.86});rideShadow=contactShadow(scene,{radius:1.1,opacity:.34});rideShadow.scale.set(1,1.6,1);rideShadow.visible=false;stage.add(bumo,sumo);bumoHelmet=helmet(bumo,0,2.04,0);bumoHelmet.visible=false;bumo.updateMatrixWorld(true);bumo.getObjectByName('Head')?.attach(bumoHelmet);await setupVariants();vehicle=n.bike;parkedHelmet=n.bike.userData.parkedHelmet||n.bike.getObjectByName('Parked green helmet')||null;bumo.visible=true;sumo.position.set(.4,0,0);bumo.position.set(2,0,.25);sumo.rotation.y=.18;paintedStage=await createPaintedStage(scene,n);paintedStage.setRoute(n.stops);paintedStage.root.visible=false;entryStage=createEntryStage(stage,n);titleTexture=await new T.TextureLoader().loadAsync('assets/game-art/title-street-v1.png');titleTexture.colorSpace=T.SRGBColorSpace;scene.background=titleTexture;entryLayout();
const pic=await new T.TextureLoader().loadAsync('assets/characters/bumo-reference.png');pic.colorSpace=T.SRGBColorSpace;card=new T.Group();const frame=new T.Mesh(new T.BoxGeometry(1.02,1.37,.06),new T.MeshStandardMaterial({color:0xe8bd75,metalness:.55,roughness:.3}));const face=new T.Mesh(new T.PlaneGeometry(.9,1.25),new T.MeshBasicMaterial({map:pic,side:T.DoubleSide}));face.position.z=.035;card.add(frame,face);card.position.set(-.55,1.32,.75);card.rotation.z=-.08;stage.add(card);card.visible=false;
const pg=new T.BufferGeometry(),verts=[],vel=[];for(let i=0;i<2400;i++){verts.push((Math.random()-.5)*.9,1.35+(Math.random()-.5)*1.25,.75);vel.push((Math.random()-.5)*4,(Math.random()-.2)*4,(Math.random()-.5)*4);}pg.setAttribute('position',new T.Float32BufferAttribute(verts,3));particles=new T.Points(pg,new T.PointsMaterial({color:0xffd797,size:.025,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));particles.userData={origin:verts,velocity:vel};stage.add(particles);
$('#track').replaceChildren(...catalog.music.tracks.map((t,i)=>new Option(t.title,i)));loadTrack(0);$('#enter').disabled=false;$('#load-status').textContent='Your adventure is ready.';mode='landing';updateProgress();if(document.documentElement.dataset.preview==='true'){show('#landing',false);beginDay();}
}catch(e){$('#fatal-message').textContent='Could not load our world: '+e.message;show('#fatal');console.error(e);}}
$('#enter').onclick=()=>{musicWanted=true;musicSync();show('#landing',false);show('#intro');mode='intro';introPlayer.start();};function welcome(){show('#intro',false);show('#welcome');mode='welcome';started=performance.now();bumo.visible=false;sumo.position.set(-1.2,0,0);card.visible=true;entryLayout();}
$('#start-day').onclick=()=>{show('#welcome',false);show('#reveal-caption');mode='reveal';started=performance.now();};
function entryLayout(){if(!camera)return;const portrait=innerWidth/innerHeight<.8;camera.userData.viewHeight=portrait?7.6:5.8;cinematic.resize(innerWidth,innerHeight);camera.position.set(0,2.5,10);camera.lookAt(0,mode==='welcome'?1.4:2.05,0);if(mode==='loading'||mode==='landing'){sumo?.position.set(portrait?-.85:.5,0,0);bumo?.position.set(portrait?.8:1.85,0,.2);}if(titleTexture){const aspect=innerWidth/innerHeight,ia=titleTexture.image.width/titleTexture.image.height;titleTexture.repeat.set(Math.min(1,aspect/ia),Math.min(1,ia/aspect));titleTexture.offset.set((1-titleTexture.repeat.x)/2,(1-titleTexture.repeat.y)/2);}}
$('#snooze').onclick=()=>{$('#sumo-dialogue').textContent='Five more minutes granted. Then we get dressed for your first day. Today we’re taking an auto—the yellow scooty adventures come later.';$('#snooze').textContent='Okay, okay. I’m awake!';$('#snooze').onclick=()=>$('#start-day').click();};
$('#title-sound').onclick=()=>{musicWanted=!musicWanted;if(catalog)musicSync();$('#title-sound').setAttribute('aria-pressed',String(musicWanted));$('#title-sound .sound-label').textContent=musicWanted?'SOUND ON':'SOUND OFF';};
function beginDay(){
 const background=n.background||new T.Color(0xd6d9cc);scene.background=background;scene.fog=n.fog||new T.Fog(0xd6d9cc,100,260);
 sun.visible=false;stageFill.visible=false;setupStorybookLighting(scene,renderer).then(light=>{worldLighting=light;light.setMood(lightingMood);light.update(bumo.position);}).catch(e=>{sun.visible=true;stageFill.visible=true;stageFill.intensity=.7;console.error(e);toast('The sky is taking longer to load. Your day is ready to explore.');});
 stage.visible=false;n.world.visible=true;scene.attach(n.bike);scene.attach(n.auto);camera.userData.viewHeight=6.4;cinematic.resize(innerWidth,innerHeight);scene.attach(bumo);scene.attach(sumo);bumo.visible=true;bumo.scale.setScalar(1);bumo.position.copy(n.spawn);bumo.position.y=.06;sumo.position.copy(bumo.position).add(new T.Vector3(-1.65,0,-.75));
 show('#reveal-caption',false);show('#hud');mode='play';const saved=document.documentElement.dataset.preview==='true'?sessionStorage.getItem('bumo-preview-chapter'):null;const home=n.stops.find(s=>s.id===(saved||'home'))||n.stops[0];targetStop(home);currentChapter=home;setCameraScene(home);updateCamera(1,true);visitStop(home);
}
function openDialog(id){keys.clear();stick.set(0,0);walkTarget=null;$(id).showModal();}
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',()=>{if(d.id==='story')clearMedia();});
function renderMedia(){clearMedia();const item=mediaItems[mediaIndex];$('#media-prev').disabled=mediaIndex<=0;$('#media-next').disabled=mediaIndex>=mediaItems.length-1;$('#media-count').textContent=mediaItems.length?`${mediaIndex+1} / ${mediaItems.length}`:'A memory in our words';if(!item){const el=new Image();el.src=memoryArt(currentStory?.id||'home');el.alt=currentStory?.name+' · illustrated memory';$('#story-media').append(el);return;}const el=document.createElement(item.type==='video'?'video':'img');el.src=item.src;if(item.type==='video'){el.controls=true;el.playsInline=true;el.preload='metadata';if(item.poster)el.poster=item.poster;el.onplay=()=>{videoPlaying=true;musicSync();};el.onpause=el.onended=()=>{videoPlaying=false;musicSync();};}else el.alt=item.alt||'A little memory of us';$('#story-media').append(el);}
function openMemory(s,{fromLibrary=false}={}){if(!s||(!fromLibrary&&(director?.playing||journey||transition)))return;if(!fromLibrary){setMemoryMood(s);setCameraScene(s);}currentStory=s;visited.add(s.id);if(s.collection)unlocked.add(s.collection);if(s.extra)unlocked.add(s.extra);save();$('#story-title').textContent=s.name;$('#story-time').textContent=s.time;$('#story-line').textContent=s.line;$('#story-detail').textContent=s.detail;$('#story-actions').replaceChildren();mediaItems=catalog.items.filter(i=>[s.collection,s.extra].includes(i.collection)&&!i.duplicate_of);mediaIndex=0;renderMedia();openDialog('#story');}
$('#letters-open').onclick=()=>{$('#map').close();openDialog('#ending');};
$('#interact').onclick=()=>openMemory(nearby);$('#media-prev').onclick=()=>{mediaIndex=Math.max(0,mediaIndex-1);renderMedia();};$('#media-next').onclick=()=>{mediaIndex=Math.min(mediaItems.length-1,mediaIndex+1);renderMedia();};$('#continue').onclick=()=>{$('#story').close();if(currentChapter.id==='cinema'){openDialog('#ending');}else{toggleRide(nextMemory());}};$('#keep-exploring').onclick=()=>$('#ending').close();
$('#library-open').onclick=()=>{const grid=$('#library-grid');grid.replaceChildren();const collections=catalog.collections.filter(c=>unlocked.has(c.id));$('#library-empty').hidden=collections.length>0;for(const c of collections){const items=catalog.items.filter(i=>i.collection===c.id&&!i.duplicate_of);const button=document.createElement('button');button.className='album';const img=new Image();img.src=items[0]?.poster||items[0]?.src||'assets/memory-art/pool-v1.png';img.alt=c.title;const text=document.createElement('strong');text.textContent=c.title+' · '+(items.length||'Illustrated memory');button.append(img,text);button.onclick=()=>{$('#library').close();const stop=n.stops.find(s=>s.collection===c.id)||n.stops.find(s=>s.extra===c.id);if(!stop)return;openMemory(stop,{fromLibrary:true});mediaItems=items;mediaIndex=0;$('#story-title').textContent=c.title;renderMedia();};grid.append(button);}openDialog('#library');};
$('#map-open').onclick=()=>{const grid=$('#map-grid');grid.replaceChildren();for(const s of n.stops){const wrap=document.createElement('div');wrap.className='map-stop'+(visited.has(s.id)?' visited':'');wrap.dataset.chapter=s.id;wrap.style.setProperty('--chapter-art',`url('assets/stage-art/${s.id}-v1.png')`);const title=document.createElement('strong');title.textContent=(visited.has(s.id)?'✓ ':'')+s.short;const sub=document.createElement('span');sub.textContent=s.time;const nav=document.createElement('button');nav.className='quiet';nav.textContent='Visit memory';nav.onclick=()=>{targetStop(s);$('#map').close();visitStop(s);};wrap.append(title,sub,nav);grid.append(wrap);}openDialog('#map');};
function trafficObstacles(){return [
 {x:bumo.position.x,z:bumo.position.z,radius:.85},
 {x:sumo.position.x,z:sumo.position.z,radius:1},
 {x:n.bike.position.x,z:n.bike.position.z,radius:2.1},
 {x:n.auto.position.x,z:n.auto.position.z,radius:2.8}
];}
function finishRide(){riding=false;journey=null;bumo.scale.setScalar(1);sumo.scale.setScalar(1);bumoHelmet.visible=false;if(parkedHelmet)parkedHelmet.visible=true;}
function frameScene(stop){cameraScene.id=stop.id;cameraScene.anchor.set(stop.x,.06,stop.z);cameraScene.shot=cinematicShots[stop.id]||cinematicShots.home;updateCamera(1,true);}
async function visitStop(stop){
 if(transition)return;transition=true;director.stop();scenePaused=false;$('#camera').textContent='Ⅱ';finishRide();
 targetStop(stop);currentChapter=stop;if(document.documentElement.dataset.preview==='true')sessionStorage.setItem('bumo-preview-chapter',stop.id);
 const images=catalog.items.filter(i=>[stop.collection,stop.extra].includes(i.collection)&&i.type!=='video'&&!i.duplicate_of).slice(0,5).map(i=>i.src);
 const book=memoryBook.start({title:stop.name,occasion:STORY[stop.id].cue,images,chapter:stop.id});
 await new Promise(r=>setTimeout(r,220));
 try{await paintedStage.setChapter(stop);n.world.visible=false;scene.fog=null;paintedStage.resize(Math.max(16,6.4*innerWidth/innerHeight+2),8);}catch(error){paintedStage.root.visible=false;n.world.visible=true;console.error(error);}
 setMemoryMood(stop);await dress(STORY[stop.id].bumo,STORY[stop.id].sumo);$('#world').dataset.chapter=stop.id;
 bumo.visible=true;bumo.rotation.set(0,0,0);sumo.rotation.set(0,0,0);bumoHelmet.visible=!!STORY[stop.id].helmet;if(parkedHelmet)parkedHelmet.visible=false;
 // The first office day arrives by auto; other memories keep the yellow scooty.
 vehicle=(stop.id==='auto'||stop.id==='office')?n.auto:n.bike;
 n.auto.visible=vehicle===n.auto;n.bike.visible=vehicle===n.bike;vehicle.position.set(stop.x+3.5,.08,stop.z+.5);vehicle.rotation.y=-.7; if(['home','pool','comedy','cinema','nails','waiwai'].includes(stop.id)){n.auto.visible=false;n.bike.visible=false;}
 $('#world').dataset.vehicle=vehicle===n.auto?'auto':'bike';
 colliders=createColliders(paintedStage.propColliders,{minX:-100,maxX:100000,minZ:-8,maxZ:8});director=createChapterMotion(colliders);
 frameScene(stop);
 try{director.start(stop,{bumo,sumo,complete:()=>{$('#travel-mode').textContent='A moment, just for us';}});}catch(error){console.error(error);toast('This entrance needs a moment. Try another chapter.');}
 n.updateTraffic.reserve?.([...pathReservations(director.paths),...trafficObstacles()],{relocate:true});
 n.updateTraffic?.(0,bumo.position,trafficObstacles());
 await book;transition=false;
 $('#travel-mode').textContent='Walking into our memory';$('#ride').textContent='Ride to '+nextMemory().short+' →';
}
function nextMemory(){return nextStoryStop(n.stops,currentChapter);}
async function toggleRide(destination){
 if(transition||director.playing||journey)return;
 const next=destination?.id?destination:nextMemory();transition=true;$('#ride').disabled=true;
 const plan=travelPlan(currentChapter,next);
 try{await (paintedStage.prepareJourney?.(currentChapter,next)||paintedStage.preload(next));}catch(error){transition=false;console.error(error);toast('The next scene is still loading. Try riding again.');return;}
 await prepareTravel(plan);transition=false;vehicle=plan.vehicle==='auto'?n.auto:n.bike;n.auto.visible=vehicle===n.auto;n.bike.visible=vehicle===n.bike;$('#world').dataset.vehicle=plan.vehicle;
 const start=[currentChapter.x+2.7,0],end=[next.x+1.8,0];
 vehicle.position.set(start[0],0,start[1]);vehicle.rotation.y=Math.PI/2;
 bumoHelmet.visible=plan.vehicle==='bike';if(parkedHelmet)parkedHelmet.visible=false;
 riding=true;journey={start,end,time:0,duration:6.8,next};heading=Math.PI/2;$('#travel-mode').textContent='Next stop: '+next.short+(plan.vehicle==='auto'?' · in our first-day auto':' · on our yellow scooty');
}
$('#ride').onclick=()=>toggleRide();$('#camera').onclick=()=>{scenePaused=!scenePaused;$('#camera').textContent=scenePaused?'▶':'Ⅱ';$('#camera').setAttribute('aria-label',scenePaused?'Resume scene':'Pause scene');};
$('#music-open').onclick=()=>openDialog('#music');$('#music-toggle').onclick=()=>{musicWanted=!musicWanted;musicSync();};$('#track').onchange=e=>{loadTrack(+e.target.value);musicSync();};$('#volume').oninput=e=>music.volume=+e.target.value;$('#repeat').onchange=musicSync;$('#mute').onclick=()=>{music.muted=!music.muted;$('#mute').textContent=music.muted?'Unmute':'Mute';};music.onerror=()=>{musicWanted=false;$('#music-toggle').textContent='Play music';$('#audio-status').textContent='This track could not load. Try another soundtrack.';};music.onended=()=>{if(!music.loop){loadTrack((musicIndex+1)%catalog.music.tracks.length);musicSync();}};
function modal(){return !!document.querySelector('dialog[open]');}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode==='intro')introPlayer.skip();if((e.key==='Enter'||e.key===' ')&&!e.repeat&&!modal()&&!['BUTTON','INPUT','SELECT'].includes(document.activeElement.tagName)){if(mode==='landing'&&!$('#enter').disabled){e.preventDefault();$('#enter').click();}else if(mode==='welcome'){e.preventDefault();$('#start-day').click();}}});
// A composed shot for each miniature set. Camera angles stay fixed while BUMO
// crosses the frame; restrained tracking starts only outside the walking zone.
const cinematicShots={
 home:{offset:[-3.6,2.8,6.5],look:[-.55,1.22,-.15]},
 coconut:{offset:[3.35,2.7,6.1],look:[-.5,1.2,-.2]},
 office:{offset:[-3.8,3.15,7.1],look:[-.5,1.35,-.3]},
 momos:{offset:[-3.25,2.65,6.1],look:[-.55,1.18,-.1]},
 nails:{offset:[3.7,2.9,6.5],look:[-.5,1.25,-.2]},
 falooda:{offset:[3.25,2.6,6.2],look:[-.5,1.18,-.15]},
 waiwai:{offset:[3.5,2.85,6.35],look:[-.55,1.3,-.3]},
 pool:{offset:[-3.8,3.3,6.7],look:[-.5,1.15,-.25]},
 comedy:{offset:[3.4,2.8,6.5],look:[-.5,1.2,-.25]},
 cinema:{offset:[-3.6,3,6.7],look:[-.5,1.3,-.25]},
 auto:{offset:[-3.7,2.9,6.6],look:[-.5,1.2,-.1]}
};
const cameraScene={id:'home',anchor:new T.Vector3(),shot:cinematicShots.home};
function setCameraScene(stop){
 cameraScene.id=stop.id;cameraScene.shot=cinematicShots[stop.id]||cinematicShots.home;
 // Opening a library album should reframe the characters where they are,
 // rather than leaving them behind to show an empty, distant set.
 cameraScene.anchor.copy(bumo.position);cameraScene.anchor.y=.06;
}
let cameraErrorLogged=false;const cameraRay=new T.Raycaster(),cameraAim=new T.Vector3(),cameraDirection=new T.Vector3(),cameraDesired=new T.Vector3(),cameraSafetyTarget=new T.Vector3();
function unobstructedCamera(target,desired){
 cameraDirection.copy(desired).sub(target);const distance=cameraDirection.length();cameraDirection.normalize();cameraRay.set(target,cameraDirection);cameraRay.near=.15;cameraRay.far=distance;
 try{
  // The list contains meshes only. Recursive raycasts would also reach Sprite
  // labels, whose raycast needs a camera and must never obstruct this view.
  const hit=cameraRay.intersectObjects(cameraObstacles,false).find(h=>h.object.visible);
  if(hit)desired.copy(target).addScaledVector(cameraDirection,Math.max(.85,hit.distance-.45));
 }catch(error){if(!cameraErrorLogged){cameraErrorLogged=true;console.warn('Camera obstruction check skipped:',error);}}
 return desired;
}
function updateCamera(dt,snap=false){
 const anchor=journey?new T.Vector3(vehicle.position.x,0,0):cameraScene.anchor,shot=cameraScene.shot;
 cameraAim.copy(anchor).add(new T.Vector3(-.55,paintedStage?.root.visible?2.65:1.3,0));
 cameraDesired.copy(anchor).add(paintedStage?.root.visible?new T.Vector3(-.55,2.65,14):new T.Vector3(shot.offset[0]*1.2,4.8,13));
 if(snap)camera.position.copy(cameraDesired);else camera.position.lerp(cameraDesired,1-Math.exp(-dt*4));
 camera.lookAt(cameraAim);
}
function animateCharacter(root,state,dt){if(!root)return;const data=root.userData,actions=data.actions;const action=actions[state]||actions.idle;
 if(action&&data.activeAction!==action){data.activeAction?.fadeOut(.18);action.reset().setEffectiveTimeScale(state==='walk'?1.05/(data.character==='bumo'?.8963:.9574):1).setEffectiveWeight(1).fadeIn(.18).play();data.activeAction=action;}
 data.mixer?.update(dt);
}

let last=performance.now();function frame(now){if(document.hidden){last=now;requestAnimationFrame(frame);return;}const dt=Math.min((now-last)/1000,.045);last=now;const time=now/1000;
if(sumo&&card&&mode!=='play'){camera.lookAt(0,mode==='welcome'?1.4:2.05,0);entryStage?.update(time);if(mode!=='reveal'){sumo.updateMatrixWorld(true);const hand=sumo.getObjectByName('LeftHand');if(hand){hand.getWorldPosition(card.position);stage.worldToLocal(card.position);card.position.add(new T.Vector3(.3,.58,.16));}card.rotation.y=Math.sin(time*.7)*.06;}}

if(mode==='reveal'){const t=(now-started)/1000;camera.position.lerp(new T.Vector3(0,2.3,7.2),.03);card.position.lerp(new T.Vector3(.8,1.3,.75),.035);card.rotation.y=t*t*3;card.visible=t<2.7;if(t>2.3){const elapsed=t-2.3;particles.material.opacity=Math.max(0,1-elapsed/2.6);const p=particles.geometry.attributes.position,o=particles.userData.origin,v=particles.userData.velocity;for(let i=0;i<p.count;i++)p.setXYZ(i,o[i*3]+.8+v[i*3]*elapsed,o[i*3+1]+v[i*3+1]*elapsed,o[i*3+2]+v[i*3+2]*elapsed);p.needsUpdate=true;bumo.visible=true;bumo.position.set(.8,0,.2);bumo.scale.setScalar(Math.min(1,elapsed*.9));}if(t>6.2)beginDay();}
if(mode==='play'){
 const paused=modal()||transition||scenePaused;
 if(n.world.visible)n.update?.(paused?0:dt,bumo.position);paintedStage?.update(time);
 walking=false;
 if(journey&&!paused){
  const j=journey;j.time+=dt;const raw=Math.min(1,j.time/j.duration),t=raw*raw*(3-2*raw);vehicle.position.set(j.start[0]+(j.end[0]-j.start[0])*t,0,j.start[1]+(j.end[1]-j.start[1])*t);groundCharacter(vehicle,0);for(const wheel of vehicle.userData.wheels||[])wheel.rotateZ(-dt*3);
  const isAuto=vehicle===n.auto,scale=isAuto?.7:.85;bumo.scale.setScalar(scale);sumo.scale.setScalar(scale);
  bumoHelmet.visible=!isAuto;if(parkedHelmet)parkedHelmet.visible=isAuto;
  const forward=new T.Vector3(1,0,0),right=new T.Vector3(0,0,-1),seat=vehicle.position;
  for(const [root,along,side] of [[bumo,isAuto?-.35:-.68,isAuto?-.32:0],[sumo,isAuto?-.35:.04,isAuto?.32:0]]){root.position.copy(seat).addScaledVector(forward,along).addScaledVector(right,side);root.position.y=vehicle.position.y+(isAuto?1.08:1.28)-root.userData.seatHeight*scale;root.rotation.y=Math.PI/2;}
  if(t>=1){const next=j.next;journey=null;visitStop(next);}
 }else if(!journey&&!transition){
  try{walking=director.update(dt,paused);}catch(error){director.stop();console.error(error);toast('The path is blocked. Choose another moment in Our day.');}
  if(!director.playing){for(const root of [bumo,sumo])root.rotation.y+=Math.atan2(Math.sin(-root.rotation.y),Math.cos(root.rotation.y))*(1-Math.exp(-dt*4));}
 }
 n.updateTraffic?.(paused?0:dt,bumo.position,trafficObstacles());
 animateCharacter(bumo,riding?'sit':walking?'walk':'idle',paused?0:dt);animateCharacter(sumo,riding?'sit':walking?'walk':'idle',paused?0:dt);
 updateCamera(dt);worldLighting?.update(bumo.position);
 nearby=currentChapter;for(const m of n.markers){m.pin.visible=false;m.ring.visible=false;}
 show('#interaction',!!nearby&&!director.playing&&!journey&&!transition&&!modal());if(nearby)$('#nearby-label').textContent=nearby.short;
 $('#ride').disabled=director.playing||!!journey||transition;
}else{animateCharacter(sumo,mode==='welcome'&&(now-started)<2400?'wave':'idle',dt);animateCharacter(bumo,'idle',dt);}
if(bumo&&sumo&&!riding&&mode!=='reveal'){groundCharacter(bumo,0);groundCharacter(sumo,0);if(mode==='play'&&vehicle?.visible)groundCharacter(vehicle,0);}
if(bumoShadow&&sumoShadow){
 const groundY=.025;
 bumoShadow.visible=bumo.visible&&!riding;sumoShadow.visible=sumo.visible&&!riding;
 bumoShadow.position.set(bumo.position.x,groundY,bumo.position.z);sumoShadow.position.set(sumo.position.x,groundY,sumo.position.z);
 if(paintedStage?.root.visible){for(const shadow of [bumoShadow,sumoShadow]){shadow.rotation.x=0;shadow.scale.y=.19;shadow.position.z+=.05;}}
 rideShadow.visible=mode==='play'&&riding;if(rideShadow.visible){rideShadow.position.set(vehicle.position.x,.041,vehicle.position.z);rideShadow.rotation.z=-heading;}
}
cinematic.render(dt);requestAnimationFrame(frame);}
window.onresize=()=>{if(mode!=='play')entryLayout();else{cinematic.resize(innerWidth,innerHeight);paintedStage?.resize(Math.max(16,6.4*innerWidth/innerHeight+2),8);}};
window.addEventListener('pagehide',event=>{if(!event.persisted){cinematic.dispose();worldLighting?.dispose();introPlayer.dispose();memoryBook.dispose();}});
requestAnimationFrame(frame);load();
if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)){let revision;setInterval(async()=>{try{const response=await fetch('/__revision',{cache:'no-store'});if(!response.ok)return;const value=await response.text();if(revision&&value!==revision&&!modal()&&!transition)location.reload();if(!revision)revision=value;}catch{}},2000);}

