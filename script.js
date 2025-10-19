// Import Three.js từ CDN
import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50, window.innerWidth / window.innerHeight, 0.1, 1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("heartCanvas"),
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Ánh sáng mềm hiệu ứng kiểu apple
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(10, 10, 10);
scene.add(light);

const ambient = new THREE.AmbientLight(0x888888);
scene.add(ambient);

// ✅ Tạo hình trái tim 3D
const heartShape = new THREE.Shape();

// Công thức vẽ hình trái tim dưới dạng path
heartShape.moveTo(0, 0);
heartShape.bezierCurveTo(0, 0.5, -1.2, 0.5, -1.2, 0);
heartShape.bezierCurveTo(-1.2, -0.8, 0, -1, 0, -1.6);
heartShape.bezierCurveTo(0, -1, 1.2, -0.8, 1.2, 0);
heartShape.bezierCurveTo(1.2, 0.5, 0, 0.5, 0, 0);

const extrudeSettings = {
  depth: 0.6,
  bevelEnabled: true,
  bevelSegments: 20,
  steps: 2,
  bevelSize: 0.3,
  bevelThickness: 0.3
};

const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
const material = new THREE.MeshPhongMaterial({
  color: 0xff1f6f,
  shininess: 90,
  specular: 0xff99d6
});
const heart = new THREE.Mesh(geometry, material);
heart.rotation.x = -Math.PI / 2;
heart.rotation.z = Math.PI;
scene.add(heart);

camera.position.set(0, 2.5, 5);

// Điều khiển xoay mượt
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 💓 Animation phập phồng trái tim
let scaleDirection = 1;
function animate() {
  requestAnimationFrame(animate);

  // phập phồng theo scale
  const scale = heart.scale.x;
  if (scale > 1.08) scaleDirection = -1;
  if (scale < 0.92) scaleDirection = 1;
  const speed = 0.004;
  const newScale = scale + speed * scaleDirection;
  heart.scale.set(newScale, newScale, newScale);

  heart.rotation.y += 0.003;
  controls.update();
  renderer.render(scene, camera);
}

animate();

// Responsive canvas
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
