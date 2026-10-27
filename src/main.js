import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { createRoom } from './world/room.js';
import { createLighting } from './world/lighting.js';
import { createButtons } from './objects/buttons.js';
import { createInterface } from './ui/interface.js';
import { createContentPanel } from './ui/panels.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030611);
scene.fog = new THREE.FogExp2(0x030611, 0.025);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 3.2, 8.5);
camera.lookAt(0, 1.5, 0);

createRoom(scene);

// Iluminación cinematográfica con rimlight azul y contraluz dorado.
const { blueLight, goldLight } = createLighting(scene);

// Las esferas se crean después de preparar la interfaz.

// Interfaz
document.body.replaceChildren();
document.body.style.cssText =
  'margin:0;overflow:hidden;background:#030611;touch-action:none';

const renderer = new WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
document.body.appendChild(renderer.domElement);

const { backendLabel, message } = createInterface();

const workspace = createContentPanel();

const buttons = createButtons(
  scene,
  camera,
  renderer.domElement,
  message,
  (name) => workspace.open(name)
);


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

async function start() {
  await renderer.init();
  renderer.setSize(window.innerWidth, window.innerHeight);

  const backend = renderer.backend;
  backendLabel.textContent =
    backend?.isWebGPUBackend === true ? 'BACKEND: WEBGPU' :
    backend?.isWebGLBackend === true ? 'BACKEND: WEBGL2' :
    'BACKEND: NO IDENTIFICADO';

  const timer = new THREE.Timer();

  renderer.setAnimationLoop(() => {
    timer.update();
    const t = timer.getElapsed();

    buttons.forEach(({ sphere, halo }, i) => {
      sphere.position.y = sphere.userData.baseY +
        Math.sin(t * 1.2 + sphere.userData.phase) * 0.12;
      sphere.rotation.y = t * 0.35;
      halo.position.y = sphere.position.y;
      halo.rotation.z = t * 0.25 + i;
    });

    blueLight.intensity = 16 + Math.sin(t * 1.8) * 3;
    renderer.render(scene, camera);
  });
}

start().catch((error) => {
  console.error(error);
  backendLabel.textContent = 'ERROR AL INICIAR WEBGPU';
});
