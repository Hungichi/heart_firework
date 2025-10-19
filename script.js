// script.js (ES module) - Three.js CDN
import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById('heartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000008, 0.00055);

const camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(0, 18, 70);

// Controls (optional, user can orbit)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 20;
controls.maxDistance = 220;

// Lights
const hemi = new THREE.HemisphereLight(0x88b3ff, 0x120016, 0.6);
scene.add(hemi);

const key = new THREE.PointLight(0xff84c8, 1.3, 300, 2);
key.position.set(60, 80, 40);
scene.add(key);

const fill = new THREE.PointLight(0x8fbfff, 0.25, 300);
fill.position.set(-60, -10, -50);
scene.add(fill);

// ---------------- GALAXY PARTICLES (procedural) ----------------
function createStarField(count = 1200, radius = 600) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i=0;i<count;i++){
    // distribute roughly spherical but with more density near equator
    const r = radius * (0.65 + Math.random()*0.7);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random()*2) - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = (Math.random() - 0.5) * 400;
    const z = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3] = x;
    positions[i*3+1] = y;
    positions[i*3+2] = z;
    sizes[i] = 0.6 + Math.random()*1.8;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 1.4,
    sizeAttenuation: true,
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });

  const pts = new THREE.Points(geo, mat);
  return pts;
}
const stars = createStarField(1400, 700);
scene.add(stars);

// faint particle cloud for depth
function createCloud(count = 600) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  for (let i=0;i<count;i++){
    pos[i*3] = (Math.random()*2 - 1) * 420;
    pos[i*3+1] = (Math.random()*2 - 1) * 160;
    pos[i*3+2] = (Math.random()*2 - 1) * 420;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: generateSoftCircle(128),
    size: 6,
    transparent: true,
    opacity: 0.06,
    depthWrite: false
  });
  return new THREE.Points(geo, mat);
}
const cloud = createCloud(700);
scene.add(cloud);

// ---------------- HEART 3D (extruded) ----------------
function makeHeartMesh() {
  const shape = new THREE.Shape();
  // smoother symmetric heart
  shape.moveTo(0, -1.1);
  shape.bezierCurveTo(0.0, -1.8, -1.6, -1.8, -1.6, -0.6);
  shape.bezierCurveTo(-1.6, 0.3, -0.2, 1.3, 0, 1.6);
  shape.bezierCurveTo(0.2, 1.3, 1.6, 0.3, 1.6, -0.6);
  shape.bezierCurveTo(1.6, -1.8, 0.0, -1.8, 0, -1.1);

  const extrude = {
    depth: 1.4,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.25,
    bevelSegments: 8,
    steps: 1
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrude);
  geom.computeVertexNormals();
  geom.translate(0, -0.4, 0);

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xff2d78),
    metalness: 0.06,
    roughness: 0.22,
    emissive: new THREE.Color(0x200016),
    emissiveIntensity: 0.18,
    clearcoat: 0.6,
    clearcoatRoughness: 0.08
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}
const heart = makeHeartMesh();
heart.scale.set(6.6, 6.6, 6.6);
heart.position.set(0, 2, 0);
heart.rotation.x = -Math.PI/2;
scene.add(heart);

// subtle dark ground
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200,1200), new THREE.MeshStandardMaterial({
  color: 0x040004, roughness: 0.98, metalness: 0.0
}));
ground.rotation.x = -Math.PI/2;
ground.position.y = -22;
scene.add(ground);

// --------------- ORBITING TEXT LAYERS ---------------
// three messages repeated on layers
const layerMessages = [
  "Happy Women's Day 💖",
  "You are loved ✨",
  "Keep shining 🌸"
];

// layer configs (radius, tilt, speed, yOffset, count)
const layersCfg = [
  { radius: 26, tilt: THREE.MathUtils.degToRad(18), speed: 0.28, yOffset: -6, count: 12 },
  { radius: 36, tilt: THREE.MathUtils.degToRad(30), speed: -0.18, yOffset: -2, count: 10 },
  { radius: 46, tilt: THREE.MathUtils.degToRad(40), speed: 0.12, yOffset: 2, count: 8 }
];

const textGroup = new THREE.Group();
scene.add(textGroup);

layersCfg.forEach((cfg, idx) => {
  const g = new THREE.Group();
  g.rotation.x = cfg.tilt;
  g.position.y = cfg.yOffset;
  g.userData = { speed: cfg.speed, radius: cfg.radius };
  // create repeated sprites
  for (let i=0;i<cfg.count;i++){
    const angle = (i / cfg.count) * Math.PI * 2;
    const sprite = makeTextSprite(layerMessages[idx % layerMessages.length], { font: '26px Arial' });
    // position on circle
    const x = Math.cos(angle) * cfg.radius;
    const z = Math.sin(angle) * cfg.radius;
    sprite.position.set(x, 0, z);
    g.add(sprite);
  }
  textGroup.add(g);
});

// ----------------- Burst (click) -----------------
const burst = new THREE.Group();
scene.add(burst);

function triggerBurst(power=1.0) {
  const COUNT = 90;
  for (let i=0;i<COUNT;i++){
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: generateSoftCircle(64),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    spr.position.copy(heart.position);
    // random dir biased upward
    const dir = new THREE.Vector3((Math.random()*2-1), (Math.random()*1.4-0.2), (Math.random()*2-1)).normalize();
    spr.userData = {
      vel: dir.multiplyScalar(6 + Math.random()*18).multiplyScalar(power),
      life: 1.1 + Math.random()*1.4
    };
    spr.scale.setScalar(0.5 + Math.random()*1.4);
    burst.add(spr);
  }
}

// ---------------- utilities ----------------
function generateSoftCircle(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,180,200,0.95)');
  g.addColorStop(0.4, 'rgba(255,100,150,0.6)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,size,size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeTextSprite(message, opts = {}) {
  const font = opts.font || '30px Arial';
  const padding = 14;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  const metrics = ctx.measureText(message);
  const textW = Math.ceil(metrics.width);
  const w = textW + padding*2;
  const h = Math.ceil(parseInt(font,10)) + padding*2;
  canvas.width = w;
  canvas.height = h;
  // draw text with glow
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(255,80,160,0.95)';
  ctx.shadowBlur = 20;
  ctx.fillText(message, w/2, h/2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: true
  });
  const sprite = new THREE.Sprite(mat);
  const scale = 0.12;
  sprite.scale.set(w * scale, h * scale, 1);
  return sprite;
}

// ---------------- animation loop ----------------
let last = performance.now();
const tmpVec = new THREE.Vector3();

function animate(now) {
  const dt = Math.min(0.06, (now - last) / 1000);
  last = now;

  // rotate distant stars/cloud slowly for parallax
  cloud.rotation.y += 0.002 * dt * 60;
  stars.rotation.y += 0.0007 * dt * 60;

  // heart breathing
  const t = now * 0.0018;
  const breathe = 1.02 + Math.sin(t * 2.3) * 0.06;
  heart.scale.setScalar(6.6 * breathe);
  heart.rotation.y += 0.0025 * dt * 60;

  // animate text layers
  textGroup.children.forEach((g) => {
    // rotate layer around its local Y
    const spd = g.userData.speed;
    g.rotation.y += spd * 0.01 * dt * 60;
    // update each sprite facing + perspective
    g.children.forEach((sprite) => {
      // world position of sprite
      sprite.getWorldPosition(tmpVec);
      // distance to camera
      const dist = tmpVec.distanceTo(camera.position);
      // perspective scaling: closer -> bigger
      const scale = THREE.MathUtils.clamp(1.6 * (220 / (dist + 40)), 0.28, 2.6);
      sprite.scale.setScalar(scale * 0.6);
      // fade based on facing (front vs back)
      // compute approximate facing: dot between sprite->center and camera dir
      const centerDir = tmpVec.clone().normalize();
      const camDir = camera.getWorldDirection(new THREE.Vector3()).normalize();
      const facing = centerDir.dot(camDir) * -1; // roughly -1..1
      sprite.material.opacity = THREE.MathUtils.clamp(0.28 + facing * 0.9, 0.12, 1.0);
      // billboard toward camera
      sprite.quaternion.copy(camera.quaternion);
    });
  });

  // update bursts
  for (let i = burst.children.length - 1; i >= 0; i--) {
    const p = burst.children[i];
    p.userData.life -= dt * 0.9;
    if (p.userData.life <= 0) {
      burst.remove(p);
      p.material.map.dispose?.();
      p.material.dispose?.();
      continue;
    }
    p.position.addScaledVector(p.userData.vel, dt);
    p.userData.vel.multiplyScalar(1 - 0.9 * dt);
    p.material.opacity = Math.max(0, p.userData.life / 1.4);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// -------------- interactions --------------
window.addEventListener('pointerdown', () => {
  triggerBurst(1.0 + Math.random()*0.8);
});

// R to reset bursts
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') {
    burst.clear();
  }
});

// responsive
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
