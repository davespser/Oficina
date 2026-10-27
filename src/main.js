import * as THREE from 'three';
import { WebGPURenderer, MeshStandardNodeMaterial } from 'three/webgpu';
import { color, mix, uv } from 'three/tsl';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030611);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 0, 5);

// TEXTURA PROCEDURAL: rugosidad y relieve microscópico
function makeNoiseTexture(size = 256) {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const noise = Math.random() * 255;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    data, size, size, THREE.RGBAFormat
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const surfaceNoise = makeNoiseTexture();

const sphereMaterial = new MeshStandardNodeMaterial({
  colorNode: mix(
    color(0x06142d),
    color(0x087fff),
    uv().y
  ),
  roughness: 0.92,
  metalness: 0.12
});

// Aplicamos los mapas de textura al material basado en nodos
sphereMaterial.roughnessMap = surfaceNoise;
sphereMaterial.bumpMap = surfaceNoise;
sphereMaterial.bumpScale = 0.13;

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 128, 96),
  sphereMaterial
);
scene.add(sphere);

// Anillo azul cobalto
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(1.42, 0.018, 12, 160),
  new THREE.MeshBasicMaterial({ color: 0x16bfff })
);
ring.rotation.x = 1.05;
scene.add(ring);

// Anillo dorado
const goldRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.52, 0.009, 8, 160),
  new THREE.MeshBasicMaterial({ color: 0xffc45c })
);
goldRing.rotation.x = 1.05;
scene.add(goldRing);

// Iluminación
scene.add(new THREE.HemisphereLight(0x7dbdff, 0x08091c, 2));

const keyLight = new THREE.DirectionalLight(0xffd39a, 3);
keyLight.position.set(3, 2, 4);
scene.add(keyLight);

const blueLight = new THREE.PointLight(0x087fff, 12, 8);
blueLight.position.set(-2, 1, 2);
scene.add(blueLight);

// Estrellas
const positions = [];
for (let i = 0; i < 450; i++) {
  positions.push(
    (Math.random() - 0.5) * 14,
    (Math.random() - 0.5) * 10,
    -2 - Math.random() * 8
  );
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(positions, 3)
);

scene.add(new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0x83bfff,
    size: 0.025,
    transparent: true,
    opacity: 0.8
  })
));

const renderer = new WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

document.body.replaceChildren();
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#030611';

renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.display = 'block';
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

async function start() {
  await renderer.init();
  renderer.setSize(window.innerWidth, window.innerHeight);

  const backendLabel = document.createElement('div');
  backendLabel.style.cssText =
    'position:fixed;top:12px;left:12px;z-index:9999;' +
    'padding:8px 12px;border-radius:8px;' +
    'font:12px monospace;color:white;' +
    'background:rgba(0,0,0,0.7);pointer-events:none;';

  const backend = renderer.backend;
  backendLabel.textContent =
    backend?.isWebGPUBackend === true ? 'BACKEND: WEBGPU' :
    backend?.isWebGLBackend === true ? 'BACKEND: WEBGL2' :
    'BACKEND: NO IDENTIFICADO';

  document.body.appendChild(backendLabel);

  const timer = new THREE.Timer();

  renderer.setAnimationLoop(() => {
    timer.update();
    const t = timer.getElapsed();

    sphere.rotation.y = t * 0.8;
    sphere.rotation.x = Math.sin(t * 0.35) * 0.12;
    ring.rotation.z = t * 0.35;
    goldRing.rotation.z = -t * 0.22;
    blueLight.intensity = 10 + Math.sin(t * 2) * 3;

    renderer.render(scene, camera);
  });
}

start().catch(console.error);
