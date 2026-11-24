import * as T from 'three';
import {EffectComposer} from '../vendor/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/postprocessing/RenderPass.js';
import {SSAOPass} from '../vendor/postprocessing/SSAOPass.js';
import {OutputPass} from '../vendor/postprocessing/OutputPass.js';
import {UnrealBloomPass} from '../vendor/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from '../vendor/postprocessing/ShaderPass.js';

// Subtle photographic finish for tactile miniature sets; no pixelation or
// character-material replacement. Grain is applied after tone mapping.
const filmShader={
 uniforms:{tDiffuse:{value:null},time:{value:0},grain:{value:.008},vignette:{value:.14}},
 vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time,grain,vignette;varying vec2 vUv;
 float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+time*17.17)*43758.5453);}
 void main(){vec4 src=texture2D(tDiffuse,vUv);vec3 c=src.rgb;
 float l=dot(c,vec3(.2126,.7152,.0722));
 // Very slight warm highlights / cool shadows; retain skin and original color.
 c*=mix(vec3(.985,1.002,1.016),vec3(1.012,1.003,.987),smoothstep(.12,.85,l));
 vec2 q=(vUv-.5)*vec2(1.12,1.0);float edge=smoothstep(.12,.67,dot(q,q));c*=1.0-vignette*edge;
 float g=(noise(gl_FragCoord.xy)-.5)*grain;c+=g*(.45+.55*(1.0-l));
 gl_FragColor=vec4(clamp(c,0.0,1.0),src.a);}`
};

/**
 * Replace renderer.render(scene,camera) with cinematic.render(deltaSeconds).
 * resize(width,height) resizes the drawing surface and camera as well as all
 * effect buffers. Install once after scene / camera creation.
 */
export function createCinematicRenderer(renderer,scene,camera){
 const dpr=Math.min(renderer.getPixelRatio(),1.5);
 renderer.setPixelRatio(dpr);
 const size=renderer.getSize(new T.Vector2());
 const composer=new EffectComposer(renderer);
 // Post-processing render targets do not inherit the canvas antialias flag.
 composer.renderTarget1.samples=Math.min(2,renderer.capabilities.maxSamples||0);
 composer.renderTarget2.samples=composer.renderTarget1.samples;
 const renderPass=new RenderPass(scene,camera);
 const ao=new SSAOPass(scene,camera,Math.max(1,size.x*dpr*.5),Math.max(1,size.y*dpr*.5),16);
 ao.kernelRadius=.65;ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA=camera.isPerspectiveCamera?1:0;
 const fullSetSize=ao.setSize.bind(ao);
 ao.setSize=(w,h)=>fullSetSize(Math.max(1,Math.ceil(w*.5)),Math.max(1,Math.ceil(h*.5)));
 // Preserve a minimum of 58% indirect light even at full occlusion. Standard
 // SSAOPass multiplies the blurred result into the HDR color buffer.
 ao.copyMaterial.uniforms.aoStrength={value:.42};
 ao.copyMaterial.fragmentShader=ao.copyMaterial.fragmentShader
  .replace('uniform float opacity;','uniform float opacity; uniform float aoStrength;')
  .replace('gl_FragColor = opacity * texel;','gl_FragColor = vec4(mix(vec3(1.0),texel.rgb,aoStrength),1.0);');
 ao.copyMaterial.needsUpdate=true;
 const bloom=new UnrealBloomPass(size,.32,.42,1.2);
 const output=new OutputPass();
 const film=new ShaderPass(filmShader);film.material.toneMapped=false;
 composer.addPass(renderPass);composer.addPass(ao);composer.addPass(bloom);composer.addPass(output);composer.addPass(film);
 let elapsed=0,disposed=false;
 function resize(w,h){
  if(disposed)return;
  w=Math.max(1,w);h=Math.max(1,h);
  renderer.setSize(w,h);if(camera.isOrthographicCamera){const height=(camera.userData.viewHeight||6.8)*(w/h<1?1.15:1);camera.top=height/2;camera.bottom=-height/2;camera.left=-height*w/h/2;camera.right=height*w/h/2;}else camera.aspect=w/h;camera.updateProjectionMatrix();composer.setSize(w,h);
 }
 function render(dt=1/60){
  if(disposed||document.hidden)return;
  elapsed+=Number.isFinite(dt)?Math.min(Math.max(dt,0),.1):1/60;
  film.uniforms.time.value=Math.floor(elapsed*24)/24;
  const range=Math.max(1,camera.far-camera.near);
  ao.minDistance=.025/range;ao.maxDistance=1.65/range;
  const uniforms=ao.ssaoMaterial.uniforms;
  uniforms.cameraNear.value=camera.near;uniforms.cameraFar.value=camera.far;
  uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
  uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
  composer.render(dt);
 }
 function dispose(){
  if(disposed)return;disposed=true;
  ao.dispose();bloom.dispose();output.dispose();film.dispose();renderPass.dispose();composer.dispose();
 }
 resize(size.x,size.y);
 return {render,resize,dispose};
}
