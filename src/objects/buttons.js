import * as THREE from 'three';

export function createButtons(scene, camera, domElement, message, onSelect = () => {}) {
  const geometry = new THREE.SphereGeometry(0.4, 64, 48);

  const names = ['DIBUJOS', 'MÚSICA', 'COPILOT'];
  const colors = [0x72cfff, 0xffc982, 0xb9a0ff];

  const buttons = [];

  for (let i = 0; i < names.length; i++) {
    const color = colors[i];

    // CRISTAL TRANSPARENTE
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xdcecff,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.92,
      thickness: 0.65,
      ior: 1.45,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      side: THREE.DoubleSide
    });

    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.set((i - 1) * 1.35, 1.8, 0.25);
    sphere.userData.buttonIndex = i;
    sphere.userData.baseY = 1.8;
    sphere.userData.phase = i * 2.1;

    scene.add(sphere);

    // GEOMETRÍA MÁGICA DENTRO DEL CRISTAL
    const inner = new THREE.Group();
    inner.position.copy(sphere.position);
    inner.position.z += 0.12;
    scene.add(inner);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      toneMapped: false
    });

    // Anillo interior
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.205, 0.006, 8, 96),
      glowMaterial
    );
    inner.add(innerRing);

    // Segundo anillo geométrico
    const secondRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.0035, 8, 96),
      new THREE.MeshBasicMaterial({
        color: 0xffdba0,
        transparent: true,
        opacity: 0.9,
        toneMapped: false
      })
    );
    secondRing.rotation.z = Math.PI / 4;
    inner.add(secondRing);

    // Estrella geométrica central
    const points = [];

    for (let j = 0; j < 8; j++) {
      const angle = j * Math.PI / 4 - Math.PI / 2;
      const radius = j % 2 === 0 ? 0.125 : 0.045;

      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        )
      );
    }

    points.push(points[0].clone());

    const starGeometry = new THREE.BufferGeometry()
      .setFromPoints(points);

    const star = new THREE.Line(
      starGeometry,
      new THREE.LineBasicMaterial({
        color: 0xffe3b0,
        toneMapped: false
      })
    );

    inner.add(star);

    // Núcleo luminoso
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.045, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        toneMapped: false
      })
    );

    inner.add(core);

    // Pequeños puntos luminosos alrededor
    for (let j = 0; j < 8; j++) {
      const angle = j * Math.PI / 4;

      const point = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 12, 8),
        glowMaterial
      );

      point.position.set(
        Math.cos(angle) * 0.205,
        Math.sin(angle) * 0.205,
        0.005
      );

      inner.add(point);
    }

    // HALO EXTERIOR LUMINOSO
    const haloMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      toneMapped: false
    });

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.465, 0.006, 8, 96),
      haloMaterial
    );

    halo.position.copy(sphere.position);
    scene.add(halo);

    // Segundo halo fino dorado
    const goldHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.49, 0.0025, 8, 96),
      new THREE.MeshBasicMaterial({
        color: 0xffc982,
        transparent: true,
        opacity: 0.75,
        toneMapped: false
      })
    );

    goldHalo.position.copy(sphere.position);
    scene.add(goldHalo);

    buttons.push({
      sphere,
      halo,
      goldHalo,
      inner,
      name: names[i]
    });
  }

  // SELECCIÓN DE LOS BOTONES
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
        i === index ? 0xffc45c : colors[i]
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
