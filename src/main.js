import * as THREE from 'three';
import {
  WebGPURenderer,
  PostProcessing
} from 'three/webgpu';

import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

import { createRoom } from './world/room.js';
import { createSky } from './world/sky.js';
import { createLandscape } from './world/landscape.js';
import { createLighting } from './world/lighting.js';
import { createButtons } from './objects/buttons.js';
import { createInterface } from './ui/interface.js';
import { createContentPanel } from './ui/panels.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030611);
scene.fog = new THREE.FogExp2(0x030611, 0.025);

createSky(scene);
createLandscape(scene);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 3.2, 8.5);
camera.lookAt(0, 1.5, 0);

createRoom(scene);

// Iluminación cinematográfica con rimlight azul y contraluz dorado.
const { blueLight, goldLight } = createLighting(scene);

// Interfaz.
document.body.replaceChildren();
document.body.style.cssText =
  'margin:0;overflow:hidden;background:#030611;touch-action:none';

const renderer = new WebGPURenderer({ antialias: true });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

renderer.domElement.style.cssText =
  'width:100%;height:100%;display:block';

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

// Postprocesado: imagen de escena + bloom.
const scenePass = pass(scene, camera);
const sceneColor = scenePass.getTextureNode('output');

const bloomPass = bloom(
  sceneColor,
  0.75, // Intensidad
  0.6,  // Radio
  0.15  // Umbral de brillo
);

const postProcessing = new PostProcessing(renderer);
postProcessing.outputNode = sceneColor.add(bloomPass);

// Cámara orbital táctil y con ratón.
const orbitTarget = new THREE.Vector3(0, 1.5, 0);
const orbitOffset = camera.position.clone().sub(orbitTarget);
const orbitRadius = orbitOffset.length();

let orbitTheta = Math.atan2(orbitOffset.x, orbitOffset.z);
let orbitPhi = Math.acos(
  THREE.MathUtils.clamp(orbitOffset.y / orbitRadius, -1, 1)
);

let lastX = 0;
let lastY = 0;
let dragging = false;

renderer.domElement.style.touchAction = 'none';

renderer.domElement.addEventListener('pointerdown', (event) => {
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
});

window.addEventListener('pointermove', (event) => {
  if (!dragging) return;

  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;

  lastX = event.clientX;
  lastY = event.clientY;

  orbitTheta -= dx * 0.006;
  orbitPhi = THREE.MathUtils.clamp(
    orbitPhi + dy * 0.006,
    0.18,
    1.48
  );

  camera.position.set(
    orbitTarget.x +
      orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta),
    orbitTarget.y + orbitRadius * Math.cos(orbitPhi),
    orbitTarget.z +
      orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta)
  );

  camera.lookAt(orbitTarget);
});

window.addEventListener('pointerup', () => {
  dragging = false;
});

window.addEventListener('pointercancel', () => {
  dragging = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Arranque WebGPU.
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

    postProcessing.render();
  });
}

start().catch((error) => {
  console.error(error);
  backendLabel.textContent = 'ERROR AL INICIAR WEBGPU';
});
