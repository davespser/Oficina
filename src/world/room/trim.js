import * as THREE from 'three';
import { createRock } from './stoneGeometry.js';

export function createArchitecturalTrim(scene, vertices, inset, pillarSize, pillarTop, beamHeight, beamDepth, stone, templeHeight) {
  // MOLDURAS ARQUITECTÓNICAS TSL: metal, cobalto y oro.
    const trimMetal = new THREE.MeshStandardMaterial({
      color: 0x182638,
      metalness: 0.82,
      roughness: 0.28
    });

    const cobaltInlay = new THREE.MeshBasicMaterial({
      color: 0x087fff,
      toneMapped: false
    });

    const goldInlay = new THREE.MeshStandardMaterial({
      color: 0xffbd58,
      metalness: 0.78,
      roughness: 0.3,
      emissive: 0x5a2608,
      emissiveIntensity: 0.65
    });

    for (let i = 0; i < 5; i++) {
      const v = vertices[i];
      const x = v.x * inset;
      const z = v.y * inset;

      // Dos bandas finas abrazan cada monolito.
      for (const y of [0.22, pillarTop - 0.24]) {
        const band = new THREE.Mesh(
          new THREE.CylinderGeometry(
            pillarSize * 0.60,
            pillarSize * 0.60,
            0.075,
            8
          ),
          trimMetal
        );
        band.position.set(x, y, z);
        band.rotation.y = Math.PI / 8;
        scene.add(band);

        const lightBand = new THREE.Mesh(
          new THREE.CylinderGeometry(
            pillarSize * 0.615,
            pillarSize * 0.615,
            0.018,
            8
          ),
          i % 2 === 0 ? cobaltInlay : goldInlay
        );
        lightBand.position.set(x, y + 0.046, z);
        lightBand.rotation.y = Math.PI / 8;
        scene.add(lightBand);
      }
    }

    // Dinteles monolíticos irregulares, siempre rectos y sin arcos.
    for (let i = 0; i < 5; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % 5];

      const ax = a.x * inset;
      const az = a.y * inset;
      const bx = b.x * inset;
      const bz = b.y * inset;

      const dx = bx - ax;
      const dz = bz - az;
      const length = Math.hypot(dx, dz) + pillarSize * 0.75;

      const beam = new THREE.Mesh(
        createRock(length, beamHeight, beamDepth, 200 + i),
        stone
      );

      beam.position.set(
        (ax + bx) / 2,
        templeHeight - beamHeight / 2,
        (az + bz) / 2
      );

      beam.rotation.y = Math.atan2(-dz, dx);
      scene.add(beam);
    }
}
