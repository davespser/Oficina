import * as THREE from 'three';

export function createButtons(scene, camera, domElement, message, onSelect = () => {}) {
  const geometry = new THREE.SphereGeometry(0.4, 48, 32);

  const material = new THREE.MeshStandardMaterial({
    color: 0x087fff,
    metalness: 0.45,
    roughness: 0.24
  });

  const buttons = [];
  const names = ['DIBUJOS', 'MÚSICA', 'TIENDA'];

  for (let i = 0; i < names.length; i++) {
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.set((i - 1) * 1.35, 1.8, 0.25);
    sphere.userData.buttonIndex = i;
    sphere.userData.baseY = 1.8;
    sphere.userData.phase = i * 2.1;

    scene.add(sphere);

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x087fff,
      toneMapped: false
    });

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.49, 0.025, 8, 64),
      haloMaterial
    );

    halo.position.copy(sphere.position);
    scene.add(halo);

    buttons.push({
      sphere,
      halo,
      name: names[i]
    });
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let messageTimeout;

  domElement.addEventListener('pointerdown', (event) => {
    const rect = domElement.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(
      buttons.map((button) => button.sphere)
    );

    if (!hits.length) return;

    const index = hits[0].object.userData.buttonIndex;
    const selected = buttons[index];

    if (!selected) return;

    buttons.forEach((button, i) => {
      button.halo.material.color.setHex(
        i === index ? 0xffc45c : 0x087fff
      );
    });

    message.textContent = selected.name + ' · SELECCIONADO';
    message.style.opacity = '1';
    onSelect(selected.name);

    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      message.style.opacity = '0';
    }, 1800);
  });

  return buttons;
}
