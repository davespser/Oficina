import * as THREE from 'three';

export function createPanoramicWindows(scene, vertices, inset, pillarSize, pillarTop, lowerBeamHeight) {
  // MARCOS PANORAMICOS DE MADERA, ABIERTOS Y SIN CRISTAL.
    // Cada lado tiene dos huecos, separados por un montante central.
    const windowWood = new THREE.MeshStandardMaterial({
      color: 0x513522,
      roughness: 0.72,
      metalness: 0.02
    });

    const woodThickness = 0.14;
    const railHeight = 0.12;
    const frameInset = pillarSize * 0.58;
    const frameBottomY = lowerBeamHeight + 0.10;
    const frameTopY = pillarTop - 0.12;
    const frameHeight = frameTopY - frameBottomY;
    const frameCenterY = (frameBottomY + frameTopY) / 2;

    for (let i = 0; i < 5; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % 5];

      const ax = a.x * inset;
      const az = a.y * inset;
      const bx = b.x * inset;
      const bz = b.y * inset;

      const dx = bx - ax;
      const dz = bz - az;
      const edgeLength = Math.hypot(dx, dz);
      if (edgeLength <= frameInset * 2) continue;

      const ux = dx / edgeLength;
      const uz = dz / edgeLength;
      const angle = Math.atan2(-dz, dx);
      const frameLength = edgeLength - frameInset * 2;
      const centerX = (ax + bx) / 2;
      const centerZ = (az + bz) / 2;

      // Dos montantes exteriores y uno central: dos ventanas por lado.
      for (const along of [
        frameInset,
        edgeLength / 2,
        edgeLength - frameInset
      ]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(
            woodThickness,
            frameHeight,
            woodThickness
          ),
          windowWood
        );

        post.position.set(
          ax + ux * along,
          frameCenterY,
          az + uz * along
        );
        post.rotation.y = angle;
        scene.add(post);
      }

      // Travesaños de madera superior e inferior, sin paneles de cristal.
      for (const y of [frameBottomY, frameTopY]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(
            frameLength,
            railHeight,
            woodThickness
          ),
          windowWood
        );

        rail.position.set(centerX, y, centerZ);
        rail.rotation.y = angle;
        scene.add(rail);
      }
    }
}
