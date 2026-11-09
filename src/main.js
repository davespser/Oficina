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

// El documento muestra su pantalla de bienvenida mientras se inicializa WebGPU.
document.body.style.cssText =
  'margin:0;overflow:hidden;background:#030611;touch-action:none';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030611);
scene.fog = new THREE.FogExp2(0x030611, 0.025);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 3.2, 8.5);
camera.lookAt(0, 1.5, 0);

const renderer = new WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.domElement.style.cssText =
  'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:2';
renderer.domElement.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

const { backendLabel, message } = createInterface();
const workspace = createContentPanel();
const bootScreen = document.querySelector('#boot-screen');

// POSTPROCESADO LUX-KHEPRI: BLOOM ORIGINAL
const scenePass = pass(scene, camera);
const sceneColor = scenePass.getTextureNode('output');
const bloomPass = bloom(sceneColor, 0.75, 0.6, 0.15);
const postProcessing = new PostProcessing(renderer);
postProcessing.outputNode = sceneColor.add(bloomPass);




// DIAGNOSTICO DE ARRANQUE
const diagnostic = document.createElement('pre');
diagnostic.id = 'startup-diagnostic';
diagnostic.style.cssText = [
  'position:fixed',
  'left:12px',
  'right:12px',
  'bottom:12px',
  'z-index:10',
  'padding:12px',
  'margin:0',
  'background:#071321ee',
  'color:#83eaff',
  'font:12px monospace',
  'white-space:pre-wrap',
  'overflow-wrap:anywhere',
  'pointer-events:none',
  'border:1px solid #287da0',
  'border-radius:8px'
].join(';');

document.body.appendChild(diagnostic);


const diagnosticStart = performance.now();
let diagnosticStage = 'JAVASCRIPT INICIADO';
let diagnosticFrames = 0;
let diagnosticLastFrame = 0;
let diagnosticError = '';

function refreshDiagnostic() {
  const elapsed = ((performance.now() - diagnosticStart) / 1000).toFixed(1);
  const backend = renderer.backend?.isWebGPUBackend ? 'WEBGPU' :
    renderer.backend?.isWebGLBackend ? 'WEBGL2' : 'NO IDENTIFICADO';
  const frameAge = diagnosticLastFrame
    ? ((performance.now() - diagnosticLastFrame) / 1000).toFixed(2) + ' s'
    : 'NINGUNO';

  diagnostic.textContent =
    'MONITOR DE OFICINA 3D\\n' +
    'TIEMPO: ' + elapsed + ' s\\n' +
    'FASE: ' + diagnosticStage + '\\n' +
    'BACKEND: ' + backend + '\\n' +
    'FOTOGRAMAS CORRECTOS: ' + diagnosticFrames + '\\n' +
    'TIEMPO DESDE ULTIMO FOTOGRAMA: ' + frameAge +
    (diagnosticError ? '\\n\\nERROR:\\n' + diagnosticError : '');
}

function markStage(stage) {
  diagnosticStage = stage;
  console.log('[OFICINA]', stage);
  refreshDiagnostic();
}

function markError(error) {
  diagnosticError = error?.stack || error?.message || String(error);
  diagnosticStage = 'ERROR DETECTADO';
  console.error('[OFICINA] ERROR:', error);
  refreshDiagnostic();
}

window.addEventListener('error', (event) => {
  markError(event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  markError(event.reason);
});

window.setInterval(refreshDiagnostic, 500);
refreshDiagnostic();

let orbitTarget;
let orbitRadius;
let orbitTheta;
let orbitPhi;
let lastX = 0;
let lastY = 0;
let dragging = false;

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (!orbitTarget) return;
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
});

window.addEventListener('pointermove', (event) => {
  if (!dragging || !orbitTarget) return;

  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  lastX = event.clientX;
  lastY = event.clientY;

  orbitTheta -= dx * 0.006;
  orbitPhi = THREE.MathUtils.clamp(orbitPhi + dy * 0.006, 0.18, 1.48);
  camera.position.set(
    orbitTarget.x + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta),
    orbitTarget.y + orbitRadius * Math.cos(orbitPhi),
    orbitTarget.z + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta)
  );
  camera.lookAt(orbitTarget);
});

window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointercancel', () => { dragging = false; });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

async function start() {
  markStage('1. INICIO DE ARRANQUE');
  // Inicializa el mismo motor con una escena vacía antes de crear geometría pesada.
  markStage('2. INICIALIZANDO RENDERER');
  await renderer.init();
  markStage('3. RENDERER INICIALIZADO');
  renderer.setSize(window.innerWidth, window.innerHeight);

  const backend = renderer.backend;
  backendLabel.textContent =
    backend?.isWebGPUBackend === true ? 'BACKEND: WEBGPU' :
    backend?.isWebGLBackend === true ? 'BACKEND: WEBGL2' :
    'BACKEND: NO IDENTIFICADO';

  // Dibuja el fondo una vez y permite que llegue a pantalla antes del montaje 3D.
  markStage('4. PRIMER RENDER DE ESCENA VACIA');
  renderer.render(scene, camera);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  markStage('5. PRIMER FRAME COMPLETADO');

  markStage('6. CREANDO CIELO');
  createSky(scene);
  markStage('7. CIELO CREADO');
  markStage('8. CREANDO PAISAJE');
  createLandscape(scene);
  markStage('9. PAISAJE CREADO');
  markStage('10. CREANDO HABITACION');
  const room = createRoom(scene, { deferMandalaTextures: true });
  markStage('11. HABITACION CREADA');
  markStage('12. CREANDO ILUMINACION');
  const { blueLight } = createLighting(scene);
  markStage('13. ILUMINACION CREADA');

  markStage('14. CREANDO BOTONES');
  const buttons = createButtons(
    scene,
    camera,
    renderer.domElement,
    message,
    (name) => workspace.open(name)
  );

  markStage('15. BOTONES CREADOS');
  orbitTarget = new THREE.Vector3(0, 1.5, 0);
  const orbitOffset = camera.position.clone().sub(orbitTarget);
  orbitRadius = orbitOffset.length();
  orbitTheta = Math.atan2(orbitOffset.x, orbitOffset.z);
  orbitPhi = Math.acos(
    THREE.MathUtils.clamp(orbitOffset.y / orbitRadius, -1, 1)
  );

  const timer = new THREE.Timer();
  let firstSceneFrame = true;

  markStage('16. ACTIVANDO BUCLE DE ANIMACION');
  let firstDiagnosticFrame = true;
  renderer.setAnimationLoop(() => {
    if (firstDiagnosticFrame) {
      firstDiagnosticFrame = false;
      markStage('17. PRIMER FRAME DE ANIMACION');
    }
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
    try {
      postProcessing.render();
      diagnosticFrames++;
      diagnosticLastFrame = performance.now();
    } catch (error) {
      markError(error);
      renderer.setAnimationLoop(null);
      return;
    }

    if (firstSceneFrame) {
      firstSceneFrame = false;
      markStage('18. OFICINA 3D DIBUJADA');
      bootScreen.hidden = true;
      // Las texturas grandes solo se solicitan después de presentar el primer fotograma.
      window.setTimeout(() => room.loadMandalaTextures(), 0);
    }
  });
}

start().catch((error) => {
  markError(error);
  console.error(error);
  backendLabel.textContent = 'ERROR AL INICIAR WEBGPU';
  const status = bootScreen.querySelector('p');
  if (status) status.textContent = 'No se pudo iniciar el espacio 3D.';
});
