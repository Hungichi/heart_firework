// script.js — Three.js (ES module) version
import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById('heartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000010, 0.0006);

const camera = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(0, 18, 60);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 20;
controls.maxDistance = 180;

// Lights
const hemi = new THREE.HemisphereLight(0x8899ff, 0x220022, 0.6);
scene.add(hemi);
const key = new THREE.PointLight(0xffc0e8, 1.2, 200);
key.position.set(40, 60, 40);
scene.add(key);
const fill = new THREE.PointLight(0x7aa0ff, 0.35, 200);
fill.position.set(-40, -30, -40);
scene.add(fill);

// ---------- GALAXY PARTICLES ----------
const starGeo = new THREE.BufferGeometry();
const STAR_COUNT = 1200;
const starPos = new Float32Array(STAR_COUNT * 3);
for (let i=0;i<STAR_COUNT;i++){
  const r = 400 + Math.random()*600;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random()*2)-1);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = (Math.random()-0.5) * 400;
  const z = r * Math.sin(phi) * Math.sin(theta);
  starPos[i*3] = x;
  starPos[i*3+1] = y;
  starPos[i*3+2] = z;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ size: 1.2, color: 0xffffff, transparent: true, opacity: 0.9, sizeAttenuation: true });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// subtle rotating particle cloud for depth
const cloudGeo = new THREE.BufferGeometry();
const CLOUD_COUNT = 600;
const cloudPos = new Float32Array(CLOUD_COUNT*3);
for(let i=0;i<CLOUD_COUNT;i++){
  const x = (Math.random()*2-1) * 300;
  const y = (Math.random()*2-1) * 120;
  const z = (Math.random()*2-1) * 300;
  cloudPos[i*3] = x;
  cloudPos[i*3+1] = y;
  cloudPos[i*3+2] = z;
}
cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
const cloudMat = new THREE.PointsMaterial({ size: 4.0, map: generateSoftCircle(128), transparent: true, opacity: 0.05, depthWrite: false });
const cloud = new THREE.Points(cloudGeo, cloudMat);
scene.add(cloud);

// ---------- HEART 3D (extruded shape) ----------
function makeHeartMesh() {
  // heart 2D shape (symmetric)
  const shape = new THREE.Shape();
  // use a smooth bezier heart shape centered
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

  // center geometry
  geom.translate(0, -0.4, 0); // adjust vertical center

  const mat = new THREE.MeshStandardMaterial({
    color: 0xff3b86,
    metalness: 0.05,
    roughness: 0.25,
    emissive: 0x220014,
    emissiveIntensity: 0.2,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

const heart = makeHeartMesh();
heart.scale.set(6.6, 6.6, 6.6);
heart.position.set(0, 2, 0);
heart.rotation.x = -Math.PI/2; // face front
scene.add(heart);

// subtle reflective ground (dark)
const groundGeo = new THREE.PlaneGeometry(1200, 1200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x060008, roughness: 0.9, metalness: 0.0 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
ground.position.y = -22;
scene.add(ground);

// ---------- ORBITING TEXT LAYERS ----------
const layerMessages = [
  "Happy Women's Day 💖",
  "You are loved ✨",
  "Keep shining 🌸"
];

// parameters: for each layer define radius, tilt, speed, y-offset
const layers = [
  { radius: 26, tilt: THREE.MathUtils.degToRad(18), speed: 0.28, yOffset: -6, count: 12 },
  { radius: 36, tilt: THREE.MathUtils.degToRad(30), speed: -0.18, yOffset: -2, count: 10 },
  { radius: 46, tilt: THREE.MathUtils.degToRad(40), speed: 0.12, yOffset: 2, count: 8 }
];

const textLayers = new THREE.Group();
scene.add(textLayers);

// create sprites for each layer
layers.forEach((cfg, li) => {
  const group = new THREE.Group();
  // tilt the group (rotate around X to incline orbit)
  group.rotation.x = cfg.tilt;
  group.position.y = cfg.yOffset;
  // add many repeated sprites showing same message
  for (let i=0;i<cfg.count;i++){
    const angle = (i / cfg.count) * Math.PI * 2;
    const sprite = makeTextSprite(layerMessages[li % layerMessages.length], { font: '24px Arial', glow: true });
    // initial position on circle
    const x = Math.cos(angle) * cfg.radius;
    const z = Math.sin(angle) * cfg.radius;
    sprite.position.set(x, 0, z);
    // face origin roughly (optional)
    // sprite.lookAt(new THREE.Vector3(0,0,0));
    group.add(sprite);
  }
  // store custom data for animation
  group.userData = { radius: cfg.radius, speed: cfg.speed };
  textLayers.add(group);
});

// ---------- helper: makeTextSprite ----------
function makeTextSprite(message, opts = {}) {
  const font = opts.font || '36px Arial';
  const padding = 12;
  // create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  const textW = Math.ceil(ctx.measureText(message).width);
  const w = textW + padding*2;
  const h = Math.ceil(parseInt(font,10)) + padding*2;
  canvas.width = w;
  canvas.height = h;

  // draw glow style
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // shadow glow
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255,80,160,0.95)';
  ctx.shadowBlur = 18;
  ctx.fillText(message, w/2, h/2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: true
  });
  const sprite = new THREE.Sprite(mat);
  // scale sprite proportionally
  const scale = 0.12;
  sprite.scale.set(w * scale, h * scale, 1);
  return sprite;
}

// ---------- burst particles around heart (click) ----------
const burstGroup = new THREE.Group();
scene.add(burstGroup);
function triggerBurst(power = 1.0) {
  const B = 90;
  for (let i=0;i<B;i++){
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: generateSoftCircle(64), transparent:true, blending: THREE.AdditiveBlending }));
    spr.position.copy(heart.position);
    // random direction
    const dir = new THREE.Vector3((Math.random()*2-1), (Math.random()*1.4-0.6), (Math.random()*2-1)).normalize();
    spr.userData = {
      vel: dir.multiplyScalar(6 + Math.random()*18).multiplyScalar(power),
      life: 1.0 + Math.random()*1.2
    };
    spr.scale.setScalar(0.6 + Math.random()*1.6);
    burstGroup.add(spr);
  }
}

// ---------- utils: generate soft circle texture ----------
function generateSoftCircle(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.15, 'rgba(255,180,200,0.95)');
  g.addColorStop(0.35, 'rgba(255,100,150,0.6)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,size,size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---------- Animation loop ----------
let last = performance.now();
function animate(now) {
  const dt = Math.min(0.06, (now - last) / 1000);
  last = now;

  // rotate galaxy cloud slowly
  cloud.rotation.y += 0.002 * dt * 60;
  stars.rotation.y += 0.0006 * dt * 60;

  // heart breathing
  const t = now * 0.002;
  const breathe = 1.02 + Math.sin(t * 2.2) * 0.06; // subtle
  heart.scale.setScalar(6.6 * breathe);
  heart.rotation.y += 0.0025 * dt * 60;

  // animate text layers: spin each group's children around Y
  textLayers.children.forEach((group, idx) => {
    const spd = group.userData.speed;
    // rotate group around Y (in its local space)
    group.rotation.y += spd * 0.01 * dt * 60;
    // update each child's facing and perspective scale/opacity
    group.children.forEach((sprite) => {
      // compute world position to camera
      sprite.getWorldPosition(tempVec);
      const camTo = tempVec.clone().sub(camera.position);
      // distance effect
      const dist = camTo.length();
      // perspective scale (closer = bigger)
      const s = THREE.MathUtils.clamp(1.4 * (200 / (dist + 40)), 0.35, 2.4);
      sprite.scale.setScalar(s * (sprite.scale.x / sprite.scale.y) * 0.6);
      // opacity based on angle (fades when backside)
      const dir = tempVec.clone().sub(new THREE.Vector3(0,0,0)).normalize();
      const facing = dir.dot(camera.getWorldDirection(new THREE.Vector3())) * -1; // approx
      sprite.material.opacity = THREE.MathUtils.clamp(0.35 + facing * 0.9, 0.12, 1.0);
      // optional: always face camera better
      sprite.quaternion.copy(camera.quaternion);
    });
  });

  // update burst particles
  for (let i = burstGroup.children.length - 1; i >= 0; i--) {
    const p = burstGroup.children[i];
    p.userData.life -= dt * 0.9;
    if (p.userData.life <= 0) {
      burstGroup.remove(p);
      p.material.map.dispose?.();
      p.material.dispose?.();
      continue;
    }
    p.position.addScaledVector(p.userData.vel, dt);
    // slow down
    p.userData.vel.multiplyScalar(1 - 0.9 * dt);
    p.material.opacity = Math.max(0, p.userData.life / 1.6);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

const tempVec = new THREE.Vector3();
requestAnimationFrame(animate);

// resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// pointer to burst
window.addEventListener('pointerdown', () => {
  triggerBurst(1.0 + Math.random()*0.8);
});

// keyboard R to reset (optional)
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') {
    // clear bursts
    burstGroup.clear();
  }
});
