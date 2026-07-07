/* ===================================================================
   1. CUSTOM CURSOR
=================================================================== */
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
let mouseXpx = window.innerWidth/2, mouseYpx = window.innerHeight/2;
let ringX = mouseXpx, ringY = mouseYpx;

window.addEventListener('mousemove', (e)=>{
  mouseXpx = e.clientX; mouseYpx = e.clientY;
  cursorDot.style.left = mouseXpx + 'px';
  cursorDot.style.top = mouseYpx + 'px';
});
function animateRing(){
  ringX += (mouseXpx - ringX) * 0.15;
  ringY += (mouseYpx - ringY) * 0.15;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();
document.querySelectorAll('[data-hover], .project-card, .ach-card, .rail-dot').forEach(el=>{
  el.addEventListener('mouseenter', ()=> cursorRing.classList.add('hover'));
  el.addEventListener('mouseleave', ()=> cursorRing.classList.remove('hover'));
});

/* normalized mouse (-1..1) for 3D scenes */
let nMouseX = 0, nMouseY = 0;
window.addEventListener('mousemove', (e)=>{
  nMouseX = (e.clientX / window.innerWidth) * 2 - 1;
  nMouseY = (e.clientY / window.innerHeight) * 2 - 1;
});

/* ===================================================================
   2. THREE.JS — HERO WAVE GRID
=================================================================== */
(function heroWave(){
  const canvas = document.getElementById('heroCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 5.5, 9);
  camera.lookAt(0,0,0);

  const W = 46, H = 30, SEG = 64;
  const geo = new THREE.PlaneGeometry(W, H, SEG, SEG);
  geo.rotateX(-Math.PI/2.35);

  const colorA = new THREE.Color(0x3fece2);
  const colorB = new THREE.Color(0x8d7bff);
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const posAttr = geo.attributes.position;
  const basePositions = Float32Array.from(posAttr.array);

  function resize(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  let t = 0;
  function animate(){
    t += 0.006;
    for(let i=0; i<count; i++){
      const ix = i*3;
      const x = basePositions[ix];
      const z = basePositions[ix+2];
      const dist = Math.sqrt(x*x + z*z);
      const y = Math.sin(dist*0.55 - t*3.2) * 0.9 * Math.exp(-dist*0.045)
              + Math.sin(x*0.35 + t*1.6) * 0.28
              + Math.cos(z*0.3 + t*1.1) * 0.22;
      posAttr.array[ix+1] = y;

      const h = (y + 1.2) / 2.4;
      const c = colorA.clone().lerp(colorB, Math.max(0, Math.min(1,h)));
      colors[ix] = c.r; colors[ix+1] = c.g; colors[ix+2] = c.b;
    }
    posAttr.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    camera.position.x += (nMouseX*2.4 - camera.position.x) * 0.02;
    camera.position.y += (5.5 - nMouseY*1.2 - camera.position.y) * 0.02;
    camera.lookAt(0,0,0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();

/* ===================================================================
   3. THREE.JS — SKILLS CONSTELLATION (drag to rotate)
=================================================================== */
(function skillsGalaxy(){
  const wrap = document.getElementById('galaxyCanvas').parentElement;
  const canvas = document.getElementById('galaxyCanvas');
  const labelsLayer = document.getElementById('galaxyLabels');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  const clusters = [
    { color: 0x3fece2, angle: 0,               skills: ["Neural Networks","TensorFlow","PyTorch","Scikit-learn","GenAI"] },
    { color: 0x8d7bff, angle: Math.PI/2,       skills: ["NLP","EDA","Statistical Analysis","Pandas/NumPy","Data Viz"] },
    { color: 0xff5fae, angle: Math.PI,         skills: ["Python","SQL","Java","Git","Linux/Bash"] },
    { color: 0xffcf6b, angle: Math.PI*1.5,     skills: ["RPA","Arduino","Cloud API","ML Pipelines"] },
  ];

  const nodes = []; // {mesh, label, el}
  const R_CLUSTER = 6.2;
  const R_NODE = 1.7;

  // core sphere
  const coreGeo = new THREE.SphereGeometry(0.55, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity:0.9, wireframe:true });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  const lineMat = new THREE.LineBasicMaterial({ color: 0x3fece2, transparent:true, opacity:0.15 });

  clusters.forEach(cluster => {
    const cx = Math.cos(cluster.angle) * R_CLUSTER;
    const cz = Math.sin(cluster.angle) * R_CLUSTER;
    const cy = (Math.random()-0.5) * 1.5;

    // line core -> cluster centroid
    const centroidLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0), new THREE.Vector3(cx,cy,cz)
    ]);
    scene.add(new THREE.Line(centroidLineGeo, lineMat));

    cluster.skills.forEach((name, i) => {
      const a = (i / cluster.skills.length) * Math.PI * 2;
      const jitterR = R_NODE * (0.7 + Math.random()*0.5);
      const nx = cx + Math.cos(a) * jitterR;
      const nz = cz + Math.sin(a) * jitterR;
      const ny = cy + (Math.random()-0.5) * 1.6;

      const size = 0.16 + Math.random()*0.09;
      const geo = new THREE.SphereGeometry(size, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color: cluster.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(nx, ny, nz);
      scene.add(mesh);

      const nodeLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(cx,cy,cz), new THREE.Vector3(nx,ny,nz)
      ]);
      const nlMat = new THREE.LineBasicMaterial({ color: cluster.color, transparent:true, opacity:0.25 });
      scene.add(new THREE.Line(nodeLineGeo, nlMat));

      const el = document.createElement('div');
      el.className = 'galaxy-label';
      el.textContent = name;
      labelsLayer.appendChild(el);

      nodes.push({ mesh, el });
    });
  });

  let hoveredIdx = -1;
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2();

  function onMove(e){
    const rect = canvas.getBoundingClientRect();
    mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', ()=>{ mouseNDC.set(-99,-99); });

  function resize(){
    const w = wrap.clientWidth, h = wrap.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const tmpV = new THREE.Vector3();
  function updateLabels(){
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(mouseNDC, camera);
    const intersects = raycaster.intersectObjects(nodes.map(n=>n.mesh));
    const hoveredMesh = intersects.length ? intersects[0].object : null;

    nodes.forEach(n=>{
      tmpV.copy(n.mesh.position).project(camera);
      const x = (tmpV.x * 0.5 + 0.5) * rect.width;
      const y = (-tmpV.y * 0.5 + 0.5) * rect.height;
      n.el.style.left = x + 'px';
      n.el.style.top = y + 'px';
      n.el.classList.toggle('show', n.mesh === hoveredMesh);
    });
  }

  function animate(){
    core.rotation.y += 0.002;
    core.rotation.x += 0.001;
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();

/* ===================================================================
   4. GSAP — hero entrance + scroll reveals
=================================================================== */
window.addEventListener('load', ()=>{
  gsap.timeline()
    .to('.hero-tag', {opacity:1, duration:.5})
    .to('.hero h1', {opacity:1, duration:1, ease:'power2.out'}, '-=0.2')
    .to('.hero-roles', {opacity:1, duration:.6}, '-=0.4')
    .to('.hero-desc', {opacity:1, duration:.6}, '-=0.3')
    .to('.hero-cta', {opacity:1, duration:.6}, '-=0.3');
});

const roles = document.querySelectorAll('#roleTrack span');
let roleIdx = 0;
setInterval(()=>{
  roleIdx = (roleIdx+1) % roles.length;
  document.getElementById('roleTrack').style.transform = `translateY(-${roleIdx*32}px)`;
}, 2600);

gsap.registerPlugin(ScrollTrigger);
document.querySelectorAll('.reveal').forEach((el)=>{
  gsap.to(el, {
    opacity:1, y:0, duration:0.9, ease:'power2.out',
    scrollTrigger:{ trigger: el, start:'top 88%' }
  });
});

document.querySelectorAll('.bar-fill').forEach((el)=>{
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: ()=>{ el.style.width = el.dataset.w + '%'; }
  });
});

/* count-up stats */
document.querySelectorAll('.num[data-count]').forEach(el=>{
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  ScrollTrigger.create({
    trigger: el, start:'top 90%', once:true,
    onEnter: ()=>{
      const obj = { v:0 };
      gsap.to(obj, {
        v: target, duration: 1.4, ease:'power2.out',
        onUpdate: ()=>{ el.textContent = Math.round(obj.v) + suffix; }
      });
    }
  });
});

/* ===================================================================
   5. NAV RAIL
=================================================================== */
const dots = document.querySelectorAll('.rail-dot');
const sections = Array.from(dots).map(d => document.querySelector(d.dataset.target));
dots.forEach(dot=>{
  dot.addEventListener('click', ()=>{
    document.querySelector(dot.dataset.target).scrollIntoView({behavior:'smooth'});
  });
});
function updateRail(){
  let idx = 0;
  const scrollPos = window.scrollY + window.innerHeight*0.4;
  sections.forEach((sec,i)=>{ if(sec && sec.offsetTop <= scrollPos) idx = i; });
  dots.forEach((d,i)=> d.classList.toggle('active', i===idx));
}
window.addEventListener('scroll', updateRail);
updateRail();

/* ===================================================================
   6. TILT EFFECT for project & achievement cards
=================================================================== */
document.querySelectorAll('.tilt').forEach(card=>{
  card.addEventListener('mousemove', (e)=>{
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - 0.5;
    const py = (e.clientY - r.top)/r.height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${px*6}deg) rotateX(${-py*6}deg) translateZ(0)`;
  });
  card.addEventListener('mouseleave', ()=>{
    card.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg)';
  });
});
