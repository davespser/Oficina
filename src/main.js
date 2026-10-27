import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b18);

const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 1.5, 6);
camera.lookAt(0, 0, 0);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 48, 48),
  new THREE.MeshStandardMaterial({
    color: 0x168cff,
    emissive: 0x063b99,
    emissiveIntensity: 1.5,
    metalness: 0.4,
    roughness: 0.22
  })
);
sphere.position.y = 0.7;
scene.add(sphere);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({
    color: 0x11172a,
    roughness: 0.85,
    metalness: 0.15
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
scene.add(floor);

scene.add(new THREE.HemisphereLight(0x8abaff, 0x101020, 2));

const light = new THREE.PointLight(0x168cff, 35, 15);
light.position.set(2, 3, 3);
scene.add(light);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

document.body.innerHTML = '';
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.appendChild(renderer.domElement);

renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.display = 'block';

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  sphere.rotation.y += 0.005;
  renderer.render(scene, camera);
});
