import * as THREE from 'three';

export function createRoom(scene) {
  const radius = 5;
  const wallHeight = 4.5;
  const vertices = [];

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    vertices.push(new THREE.Vector2(
      Math.sin(angle) * radius,
      Math.cos(angle) * radius
    ));
  }

  const metal = new THREE.MeshStandardMaterial({
    color: 0x101827,
    metalness: 0.85,
    roughness: 0.3
  });

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x080e1b,
    metalness: 0.65,
    roughness: 0.28
  });

  const blue = new THREE.MeshBasicMaterial({ color: 0x087fff });
  const gold = new THREE.MeshBasicMaterial({ color: 0xffc45c });

  // Suelo pentagonal
  const shape = new THREE.Shape();
  shape.moveTo(vertices[0].x, vertices[0].y);

  for (let i = 1; i < 5; i++) {
    shape.lineTo(vertices[i].x, vertices[i].y);
  }
  shape.closePath();

  const floor = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    floorMaterial
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Paredes y remates luminosos
  for (let i = 0; i < 5; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % 5];
    const midX = (a.x + b.x) / 2;
    const midZ = (a.y + b.y) / 2;

    // Entrada abierta hacia la cámara
    if (midZ > 0.1) continue;

    const dx = b.x - a.x;
    const dz = b.y - a.y;
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(-dz, dx);

    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(length, wallHeight, 0.18),
      metal
    );
    wall.position.set(midX, wallHeight / 2, midZ);
    wall.rotation.y = angle;
    scene.add(wall);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.035, 0.035),
      i % 2 === 0 ? gold : blue
    );
    trim.position.set(midX, wallHeight - 0.15, midZ);
    trim.rotation.y = angle;
    scene.add(trim);
  }

  // Columnas de las esquinas
  for (let i = 0; i < 5; i++) {
    const v = vertices[i];
    if (v.y > 1.5) continue;

    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, wallHeight, 0.16),
      metal
    );
    pillar.position.set(v.x, wallHeight / 2, v.y);
    scene.add(pillar);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.035, 0.19),
      i % 2 === 0 ? blue : gold
    );
    glow.position.set(v.x, wallHeight - 0.3, v.y);
    scene.add(glow);
  }

  // Líneas luminosas del perímetro del suelo
  for (let i = 0; i < 5; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % 5];

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x * 0.88, 0.025, a.y * 0.88),
      new THREE.Vector3(b.x * 0.88, 0.025, b.y * 0.88)
    ]);

    scene.add(new THREE.Line(
      geometry,
      i % 2 === 0 ? blue : gold
    ));
  }

  // Plataforma central
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.65, 0.12, 64),
    metal
  );
  platform.position.y = 0.09;
  scene.add(platform);

  // Anillo principal: núcleo celeste luminoso.
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x8cecff,
    toneMapped: false
  });

  const platformRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.48, 0.025, 8, 128),
    coreMaterial
  );
  platformRing.rotation.x = Math.PI / 2;
  platformRing.position.y = 0.18;
  scene.add(platformRing);

  // Halo cobalto exterior: segunda capa para dar profundidad.
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x087fff,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });

  const platformHalo = new THREE.Mesh(
    new THREE.TorusGeometry(1.53, 0.075, 12, 128),
    haloMaterial
  );
  platformHalo.rotation.x = Math.PI / 2;
  platformHalo.position.y = 0.155;
  scene.add(platformHalo);

  // Luz real azul celeste que ilumina la plataforma y el suelo.
  const platformLight = new THREE.PointLight(0x38cfff, 12, 5, 2);
  platformLight.position.set(0, 0.42, 0);
  scene.add(platformLight);

  return {
    vertices,
    platform,
    platformRing,
    platformHalo,
    platformLight
  };
}
