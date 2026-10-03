// Scroll is the timeline. DOM content remains available without WebGL or JavaScript.
const host = document.querySelector('#scene');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('#motion-toggle');
const stories = [...document.querySelectorAll('.story-chapter')];
const links = [...document.querySelectorAll('.chapter-nav a')];
const work = document.querySelector('#work');
let paused = motion.matches, renderOnce = () => {}, resizeScene = () => {};
let bounds = [], stage = 0, inScene = true;
function syncMotion() {
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? '开启动效' : '暂停动效');
  document.querySelector('#motion-label').textContent = paused ? '开启动效' : '暂停动效';
  document.querySelector('#motion-icon').textContent = paused ? '▷' : 'Ⅱ';
  document.body.classList.toggle('motion-paused', paused);
}
syncMotion();
toggle.addEventListener('click', () => { paused = !paused; syncMotion(); renderOnce(); });
motion.addEventListener('change', e => { paused = e.matches; syncMotion(); renderOnce(); });
function measure() { bounds = stories.map(el => ({ top: el.offsetTop, height: el.offsetHeight })); updateScroll(); }
function updateScroll() {
  const y = scrollY;
  let index = 0;
  bounds.forEach((b, i) => { if (y + innerHeight * .4 >= b.top) index = i; });
  // A camera move begins before the next chapter and settles for the sticky reading interval.
  stage = 0;
  for (let i = 1; i < bounds.length; i++) {
    const start = bounds[i].top - innerHeight * .85;
    const end = bounds[i].top - innerHeight * .06;
    const t = Math.max(0, Math.min(1, (y - start) / (end - start)));
    stage = i - 1 + t * t * (3 - 2 * t);
    if (t < 1) break;
  }
  inScene = y < work.offsetTop;
  const onIndex = y + innerHeight * .4 >= work.offsetTop;
  document.body.classList.toggle('on-index', onIndex && y < document.querySelector('#about').offsetTop - innerHeight * .4);
  links.forEach((a,i) => { const active = i === (onIndex ? 5 : index); a.classList.toggle('active',active); active ? a.setAttribute('aria-current','location') : a.removeAttribute('aria-current'); });
  document.querySelector('#scroll-progress').style.width = `${y / Math.max(1,document.documentElement.scrollHeight-innerHeight)*100}%`;
  document.querySelector('#scene-index').textContent = ['00 / ORIGIN','01 / VOICE','02 / BRIDGE','03 / WORKFLOW','04 / CREATIVE'][index];
  renderOnce();
}
let queued = false;
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; updateScroll(); }); } }, { passive: true });
addEventListener('resize', () => { measure(); resizeScene(); });
function openProjectHash() {
  const id = location.hash.slice(1);
  const target = document.getElementById(id);
  if (target?.matches('details')) { target.open = true; requestAnimationFrame(() => { measure(); target.scrollIntoView({ behavior: paused ? 'instant' : 'smooth', block:'start' }); }); }
}
addEventListener('hashchange',openProjectHash);
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
  const target = document.getElementById(a.getAttribute('href').slice(1));
  if (target?.matches('details')) target.open = true;
}));
document.querySelectorAll('details').forEach(el => el.addEventListener('toggle',measure));
measure(); openProjectHash();
function fallback() { document.body.classList.add('scene-unavailable'); toggle.disabled=true; toggle.setAttribute('aria-label','静态展示'); document.querySelector('#motion-label').textContent='静态展示'; }
import('./assets/three.module.js').then(T => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'high-performance'});
  if (!context) { fallback(); return; }
  const renderer = new T.WebGLRenderer({canvas,context,antialias:false});
  renderer.setClearColor(0x05090d,1); renderer.outputColorSpace=T.SRGBColorSpace;
  host.appendChild(canvas);
  const scene = new T.Scene(); scene.background=new T.Color(0x05090d); scene.fog=new T.FogExp2(0x05090d,.014);
  const camera = new T.PerspectiveCamera(58,1,.15,190);
  let width=1,height=1, tick=0, previous=0, running=false, frameId=0;
  const animators=[];
  let randomSeed=1347;
  const random=()=>{randomSeed=(randomSeed*16807)%2147483647;return(randomSeed-1)/2147483646;};
  const lineMaterial = new T.LineBasicMaterial({color:0x56bacb,transparent:true,opacity:.32});
  const brightMaterial = new T.LineBasicMaterial({color:0xb5fcff,transparent:true,opacity:.9});
  const faintMaterial = new T.LineBasicMaterial({color:0x367185,transparent:true,opacity:.18});
  const whiteMaterial = new T.MeshBasicMaterial({color:0xa9f7ff});
  function segments(points,material=lineMaterial,parent=scene) { const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));const l=new T.LineSegments(g,material);parent.add(l);return l; }
  function boxEdges(points,x,y,z,sx,sy,sz) {
    const verts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
    for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]) for(const i of [a,b]) points.push(x+verts[i][0]*sx/2,y+verts[i][1]*sy/2,z+verts[i][2]*sz/2);
  }
  function tube(points,radius=.025,color=0xb7ffff,parent=scene) {
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const mesh=new T.Mesh(new T.TubeGeometry(curve,100,radius,5,false),new T.MeshBasicMaterial({color})); parent.add(mesh);return {mesh,curve};
  }
  // GPU-animated glyph terrain: one draw call, no per-frame position uploads.
  const atlas=document.createElement('canvas');atlas.width=512;atlas.height=256;
  const ctx=atlas.getContext('2d');ctx.fillStyle='white';ctx.font='22px Consolas, monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  const chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]<>/=+*;:._-';
  for(let i=0;i<128;i++) ctx.fillText(chars[i%chars.length],(i%16)*32+16,Math.floor(i/16)*32+17);
  const atlasTexture=new T.CanvasTexture(atlas);atlasTexture.minFilter=T.LinearFilter;atlasTexture.magFilter=T.LinearFilter;
  const count=16000,pos=new Float32Array(count*3),glyph=new Float32Array(count),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){const x=(random()-.5)*105,z=35-random()*350;pos.set([x,-7.5+Math.sin(x*.2+z*.07)*2,z],i*3);glyph[i]=Math.floor(random()*128);seeds[i]=random();}
  const glyphG=new T.BufferGeometry();glyphG.setAttribute('position',new T.BufferAttribute(pos,3));glyphG.setAttribute('aGlyph',new T.BufferAttribute(glyph,1));glyphG.setAttribute('aSeed',new T.BufferAttribute(seeds,1));
  const glyphM=new T.ShaderMaterial({uniforms:{uTime:{value:0},uScale:{value:1},uAtlas:{value:atlasTexture}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`attribute float aGlyph;attribute float aSeed;uniform float uTime;uniform float uScale;varying float vGlyph;varying float vFade;varying float vSeed;void main(){vec3 p=position;p.y+=sin(p.x*.12+p.z*.12+uTime*.22)*1.6;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uScale*(.4+aSeed*.4)/max(1.,-mv.z),1.,36.);vGlyph=aGlyph;vSeed=aSeed;vFade=exp(-length(mv.xyz)*.022)*smoothstep(1.,5.,-mv.z);}`,
    fragmentShader:`uniform sampler2D uAtlas;varying float vGlyph;varying float vFade;varying float vSeed;void main(){vec2 tile=vec2(mod(vGlyph,16.),7.-floor(vGlyph/16.));vec2 uv=(tile+vec2(gl_PointCoord.x,1.-gl_PointCoord.y))/vec2(16.,8.);float a=texture2D(uAtlas,uv).a;vec3 col=mix(vec3(.12,.46,.55),vec3(.63,.97,1.),step(.93,vSeed));gl_FragColor=vec4(col,a*vFade*(.27+vSeed*.45));}`});
  const field=new T.Points(glyphG,glyphM);field.frustumCulled=false;scene.add(field);
  const architectural=[];
  for(let i=0;i<160;i++){const z=8-random()*308,x=(random()<.5?-1:1)*(17+random()*34),y=-6+random()*23;const s=1.5+random()*6;boxEdges(architectural,x,y,z,s,s,s);}
  segments(architectural,faintMaterial);
  // The opening architecture is a cutaway lattice, with a luminous path passing through it.
  const origin=new T.Group();origin.position.set(11,2,-17);origin.rotation.set(.25,.5,.25);scene.add(origin);
  const cells=[];
  for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)for(let z=-3;z<=3;z++)if(Math.abs(x)+Math.abs(y)+Math.abs(z)<7 && random()>.32)boxEdges(cells,x*2.7,y*2.7,z*2.7,2.5,2.5,2.5);
  segments(cells,new T.LineBasicMaterial({color:0x69d5e7,transparent:true,opacity:.48}),origin);
  const path=[];for(let i=0;i<=90;i++){const t=i/90*Math.PI*3;path.push([Math.cos(t)*6,Math.sin(t)*6,(i/90-.5)*23]);}tube(path,.045,0xc7ffff,origin);
  const nucleus=new T.Mesh(new T.IcosahedronGeometry(1.5,0),new T.MeshBasicMaterial({color:0xbbffff,wireframe:true}));origin.add(nucleus);
  animators.push(t=>{origin.rotation.y=.5+t*.026;nucleus.rotation.set(t*.12,t*.17,0);});
  // Continuous route markers establish depth across all four chapters.
  const route=[];for(let z=10;z>-300;z-=5){route.push(-3,-6,z,-3,-6,z-2,3,-6,z,3,-6,z-2);}segments(route,new T.LineBasicMaterial({color:0x81ecff,transparent:true,opacity:.3}));
  function label(text,x,y,z,parent,scale=1) {
    const c=document.createElement('canvas');c.width=512;c.height=64;
    const g=c.getContext('2d');g.font='24px Consolas, monospace';g.fillStyle='#9ee7f5';g.textAlign='center';g.fillText(text,256,40);
    const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,opacity:.85}));
    sprite.position.set(x,y,z);sprite.scale.set(8*scale,scale,1);parent.add(sprite);return sprite;
  }
  const sphereGeometry=new T.SphereGeometry(.11,8,6);
  function packet(curve,phase,speed,parent=scene){const dot=new T.Mesh(sphereGeometry,whiteMaterial);parent.add(dot);animators.push(t=>curve.getPoint((t*speed+phase)%1,dot.position));return dot;}
  // 01 — the audio stage: parallel voice tracks, a procedural waveform and service rings.
  const audioStage=new T.Group();audioStage.position.set(10,0,-65);scene.add(audioStage);
  const waveUniform={value:0};
  const barGeometry=new T.BoxGeometry(.065,1,.065);
  const barCount=360;
  const barSeeds=new Float32Array(barCount);
  for(let i=0;i<barCount;i++)barSeeds[i]=i;
  barGeometry.setAttribute('aPhase',new T.InstancedBufferAttribute(barSeeds,1));
  const barMaterial=new T.MeshBasicMaterial({color:0x79edff,transparent:true,opacity:.72});
  barMaterial.onBeforeCompile=shader=>{shader.uniforms.uTime=waveUniform;shader.vertexShader='attribute float aPhase;uniform float uTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','vec3 transformed = vec3(position);float amp=.22+pow(abs(sin(aPhase*.16-uTime*.8)*cos(aPhase*.031+uTime*.32)),1.5)*5.;transformed.y*=amp;');};
  const bars=new T.InstancedMesh(barGeometry,barMaterial,barCount);audioStage.add(bars);
  const dummy=new T.Object3D();const columns=barCount/6;
  for(let i=0;i<barCount;i++){const row=Math.floor(i/columns),col=i%columns;dummy.position.set((col/(columns-1)-.5)*16,(row-2.5)*.45,(row-2.5)*1.9);dummy.updateMatrix();bars.setMatrixAt(i,dummy.matrix);}bars.instanceMatrix.needsUpdate=true;
  const voiceLines=[];
  for(let row=0;row<6;row++)voiceLines.push(-9,(row-2.5)*.45,(row-2.5)*1.9,9,(row-2.5)*.45,(row-2.5)*1.9);
  segments(voiceLines,lineMaterial,audioStage);
  for(let ring=0;ring<3;ring++){
    const points=[];for(let i=0;i<128;i++){const a=i/128*Math.PI*2,b=(i+1)/128*Math.PI*2;points.push(Math.cos(a)*(8.8+ring*.8),Math.sin(a)*(8.8+ring*.8),-4-ring,Math.cos(b)*(8.8+ring*.8),Math.sin(b)*(8.8+ring*.8),-4-ring);}
    const obj=segments(points,ring===0?lineMaterial:faintMaterial,audioStage);obj.rotation.y=.45;
  }
  const audioCurve=[];for(let i=0;i<=120;i++){const x=(i/120-.5)*21;audioCurve.push([x,Math.sin(x*.66)*Math.exp(-x*x/90)*3.1,-.3]);}
  const voicePath=tube(audioCurve,.04,0xc4ffff,audioStage);for(let i=0;i<4;i++)packet(voicePath.curve,i/4,.08,audioStage);
  label('TEXT  /  QUEUE  /  PROVIDER',0,6,-2,audioStage,.9);label('COSYVOICE — DESKTOP TTS',0,-6,2,audioStage,.85);
  animators.push(t=>{waveUniform.value=t;audioStage.rotation.y=.12+Math.sin(t*.11)*.1;});
  // 02 — two endpoint windows joined by actual directional packet paths.
  const mediaStage=new T.Group();mediaStage.position.set(-11,0,-131);mediaStage.rotation.y=-.18;scene.add(mediaStage);
  const portalLines=[];
  for(let i=0;i<7;i++){const z=(i-3)*3;boxEdges(portalLines,0,0,z,13-i*.65,9-i*.25,.06);}
  segments(portalLines,new T.LineBasicMaterial({color:0x67bfd8,transparent:true,opacity:.48}),mediaStage);
  const browserLines=[];boxEdges(browserLines,-3.7,1.7,5,6.5,4.8,.25);browserLines.push(-6.9,3,5.2,-.5,3,5.2);boxEdges(browserLines,4,-1.7,-7,5,4,.3);segments(browserLines,brightMaterial,mediaStage);
  const playShape=new T.BufferGeometry();playShape.setAttribute('position',new T.Float32BufferAttribute([3.4,-.8,-6.78,3.4,-2.6,-6.78,4.9,-1.7,-6.78],3));mediaStage.add(new T.Mesh(playShape,new T.MeshBasicMaterial({color:0x93f4ff,side:T.DoubleSide})));
  for(let row=0;row<3;row++){
    const lane=tube([[-5.8,1.6-row*.7,5.3],[-1,1.6-row*.7,5.3],[0,1.6-row*.7,1],[1,-1.6-row*.7,-4],[4.1,-1.6-row*.7,-6.7]],.025,row===0?0xd4ffff:0x4488a6,mediaStage);
    packet(lane.curve,row*.25,.08+row*.018,mediaStage);
  }
  const timeline=[];for(let i=0;i<35;i++)timeline.push(-7+i*.4,-5.5,6,-7+i*.4,-5.5+(i%5===0?.5:.18),6);segments(timeline,lineMaterial,mediaStage);
  label('IWARA API',-3.7,5,5,mediaStage,.62);label('LOCAL LIBRARY',4,-4.6,-7,mediaStage,.65);label('QUEUE / RESUME / NFO',0,-7,3,mediaStage,.85);
  animators.push(t=>mediaStage.rotation.z=Math.sin(t*.1)*.018);
  // 03 — model providers, queue state and a common interface. Merged edges and instancing keep draw calls bounded.
  const workflowStage=new T.Group();workflowStage.position.set(11,-3,-197);workflowStage.rotation.y=.28;scene.add(workflowStage);
  const blocks=[],streets=[];const nodePositions=[];
  for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++){
    if(random()>.78)continue;const h=.6+random()*4;boxEdges(blocks,x*2.8,h/2,z*2.8,1.8,h,1.8);nodePositions.push(new T.Vector3(x*2.8,h+.15,z*2.8));
    streets.push(x*2.8,0,-11,x*2.8,0,11,-11,0,z*2.8,11,0,z*2.8);
  }
  segments(blocks,new T.LineBasicMaterial({color:0x8bdee7,transparent:true,opacity:.58}),workflowStage);segments(streets,faintMaterial,workflowStage);
  const nodes=new T.InstancedMesh(new T.OctahedronGeometry(.14,0),whiteMaterial,nodePositions.length);workflowStage.add(nodes);
  nodePositions.forEach((p,i)=>{dummy.position.copy(p);dummy.scale.setScalar(1);dummy.updateMatrix();nodes.setMatrixAt(i,dummy.matrix);});nodes.instanceMatrix.needsUpdate=true;
  for(let i=0;i<7;i++){const a=nodePositions[(i*4)%nodePositions.length],b=nodePositions[(i*4+15)%nodePositions.length];const curve=tube([[a.x,a.y,a.z],[a.x,a.y+4,a.z],[(a.x+b.x)/2,7+(i%3),0],[b.x,b.y+3,b.z],[b.x,b.y,b.z]],.018,i%2?0x326275:0x92eaf5,workflowStage);packet(curve.curve,i/7,.035,workflowStage);}
  const knowledgeHub=new T.Mesh(new T.IcosahedronGeometry(1.8,1),new T.MeshBasicMaterial({color:0x9af6ff,wireframe:true,transparent:true,opacity:.65}));knowledgeHub.position.set(0,8,0);workflowStage.add(knowledgeHub);
  label('NEIROHA',0,12,0,workflowStage,1);label('RIVERPOD / DRIFT / SHELF',0,-1,11,workflowStage,.8);
  animators.push(t=>{knowledgeHub.rotation.set(t*.08,t*.13,0);});
  // 04 — a shader-deformed ocean with its wire surface and a distant knowledge portal.
  const oceanStage=new T.Group();oceanStage.position.set(0,-4,-269);scene.add(oceanStage);
  const oceanG=new T.PlaneGeometry(75,60,96,72);oceanG.rotateX(-Math.PI/2);
  const oceanM=new T.ShaderMaterial({uniforms:{uTime:{value:0},uFocus:{value:1}},transparent:true,depthWrite:false,wireframe:true,
    vertexShader:`uniform float uTime;varying float vY;varying float vDistance;void main(){vec3 p=position;p.y=sin(p.x*.2+uTime*.24)*cos(p.z*.17-uTime*.2)*2.+sin(p.x*.09+p.z*.18+uTime*.3);vY=p.y;vec4 mv=modelViewMatrix*vec4(p,1.);vDistance=length(mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uFocus;varying float vY;varying float vDistance;void main(){vec3 c=mix(vec3(.025,.17,.24),vec3(.36,.86,.94),smoothstep(-2.,3.,vY));gl_FragColor=vec4(c,exp(-vDistance*.025)*.48*uFocus);}`});oceanStage.add(new T.Mesh(oceanG,oceanM));
  const portal=new T.Group();portal.position.set(10,8,-8);portal.rotation.y=-.18;oceanStage.add(portal);
  for(let i=0;i<4;i++){const edges=[];boxEdges(edges,0,0,-i*2.4,13-i,15-i,.05);segments(edges,i===0?brightMaterial:lineMaterial,portal);}
  const globe=new T.Mesh(new T.IcosahedronGeometry(4,2),new T.MeshBasicMaterial({color:0x59bacb,wireframe:true,transparent:true,opacity:.5}));globe.position.set(0,0,-5);portal.add(globe);
  label('PENGUIN / CANVAS',0,10,0,portal,.8);
  const contour=[];for(let i=0;i<=90;i++){const a=i/90*Math.PI*2;contour.push([Math.cos(a)*8,Math.sin(a)*2+1,Math.sin(a)*8-4]);}tube(contour,.035,0xadfaff,portal);
  animators.push((t,s)=>{oceanM.uniforms.uTime.value=t;oceanM.uniforms.uFocus.value=T.MathUtils.smoothstep(s,3.05,3.8);globe.rotation.y=t*.045;});
  const positions=[new T.Vector3(-1,4,22),new T.Vector3(-2,4,-42),new T.Vector3(2,3,-107),new T.Vector3(-2,12,-169),new T.Vector3(-1,9,-239)];
  const targets=[new T.Vector3(2,1,-17),new T.Vector3(0,0,-65),new T.Vector3(0,0,-131),new T.Vector3(1,0,-195),new T.Vector3(3,0,-269)];
  const positionPath=new T.CatmullRomCurve3(positions,false,'catmullrom',.25),targetPath=new T.CatmullRomCurve3(targets,false,'catmullrom',.25);
  const pointer=new T.Vector2();addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);renderOnce();}},{passive:true});
  // Selective glow, downsampled and blurred in two passes.
  const rtType=renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType;
  const mainTarget=new T.WebGLRenderTarget(1,1,{type:rtType,depthBuffer:true});
  const glowA=new T.WebGLRenderTarget(1,1,{type:rtType,depthBuffer:false}),glowB=glowA.clone();
  const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const quad=new T.Mesh(new T.PlaneGeometry(2,2));postScene.add(quad);
  const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}`;
  const bright=new T.ShaderMaterial({uniforms:{map:{value:mainTarget.texture}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D map;void main(){vec3 c=texture2D(map,vUv).rgb;float b=max(max(c.r,c.g),c.b);gl_FragColor=vec4(c*smoothstep(.35,.95,b),1.);}`});
  const blur=new T.ShaderMaterial({uniforms:{map:{value:null},step:{value:new T.Vector2()}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D map;uniform vec2 step;void main(){vec3 c=texture2D(map,vUv).rgb*.227027;c+=(texture2D(map,vUv+step*1.384615).rgb+texture2D(map,vUv-step*1.384615).rgb)*.316216;c+=(texture2D(map,vUv+step*3.230769).rgb+texture2D(map,vUv-step*3.230769).rgb)*.070270;gl_FragColor=vec4(c,1.);}`});
  const composite=new T.ShaderMaterial({uniforms:{base:{value:mainTarget.texture},glow:{value:glowA.texture}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D base;uniform sampler2D glow;void main(){vec3 c=texture2D(base,vUv).rgb+texture2D(glow,vUv).rgb*.75;float vig=1.-dot(vUv-.5,vUv-.5)*.48;c*=vig;gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
  }`});
  function pass(mat,target){quad.material=mat;renderer.setRenderTarget(target);renderer.render(postScene,postCamera);}
  resizeScene=()=>{width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio,width<701?1.3:1.5);glyphG.setDrawRange(0,width<701?6000:count);renderer.setPixelRatio(ratio);renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();mainTarget.setSize(Math.round(width*ratio),Math.round(height*ratio));glowA.setSize(Math.round(width*ratio/3),Math.round(height*ratio/3));glowB.setSize(glowA.width,glowA.height);glyphM.uniforms.uScale.value=height*ratio*.7;renderOnce();};
  function draw(now){
    running=false;
    const dt=Math.min(.04,(now-previous)/1000||0);previous=now;if(!paused)tick+=dt;
    const s=Math.max(0,Math.min(4,stage)),p=s/4;
    // Reduced motion / pause keeps a stable chapter view; native page scrolling still works.
    const view=paused?Math.round(s)/4:p;
    camera.position.copy(positionPath.getPoint(view));const target=targetPath.getPoint(view);
    if(width<701){
      const centers=[7,9,-11,10,7],lo=Math.floor(view*4),hi=Math.min(4,lo+1);
      const shift=T.MathUtils.lerp(centers[lo],centers[hi],view*4-lo);
      camera.position.x+=shift;target.x+=shift;
      camera.position.y+=5;camera.position.z+=11;target.y+=4;
    }
    if(!paused){camera.position.x+=pointer.x*.65;camera.position.y-=pointer.y*.3;}
    camera.lookAt(target);if(!paused)camera.rotateZ(Math.sin(p*Math.PI*4)*.045);
    glyphM.uniforms.uTime.value=tick;animators.forEach(fn=>fn(tick,s));
    document.querySelector('#scene-depth').textContent=`Z ${camera.position.z>=0?'+':''}${camera.position.z.toFixed(1).padStart(5,'0')}`;
    renderer.setRenderTarget(mainTarget);renderer.render(scene,camera);
    pass(bright,glowA);blur.uniforms.map.value=glowA.texture;blur.uniforms.step.value.set(1.6/glowA.width,0);pass(blur,glowB);blur.uniforms.map.value=glowB.texture;blur.uniforms.step.value.set(0,1.6/glowA.height);pass(blur,glowA);pass(composite,null);
    if(!paused&&!document.hidden&&inScene){running=true;frameId=requestAnimationFrame(draw);}
  }
  renderOnce=()=>{if(!running&&!document.hidden&&inScene){running=true;frameId=requestAnimationFrame(draw);}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);running=false;}else{previous=performance.now();renderOnce();}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frameId);running=false;fallback();});
  resizeScene();
}).catch(error=>{console.error('Scene could not start:',error);fallback();});
