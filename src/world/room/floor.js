import * as THREE from 'three';

export function createRoomFloor(scene, vertices, inset) {
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x080e1b,
    metalness: 0.65,
    roughness: 0.28
  });

  const blue = new THREE.LineBasicMaterial({ color: 0x087fff });
  const gold = new THREE.LineBasicMaterial({ color: 0xffc45c });

  const shape = new THREE.Shape();
  shape.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < 5; i++) shape.lineTo(vertices[i].x, vertices[i].y);
  shape.closePath();

  const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  for (let i = 0; i < 5; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % 5];
    const line = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x * inset, 0.025, a.y * inset),
      new THREE.Vector3(b.x * inset, 0.025, b.y * inset)
    ]);
    scene.add(new THREE.Line(line, i % 2 === 0 ? blue : gold));
  }

  return { floor, floorMaterial, blue, gold };
}
