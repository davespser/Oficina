import * as THREE from 'three';

export function createCurtains(scene, vertices, inset, pillarTop) {
  // CORTINAS LATERALES, DOS PAÑOS POR COLUMNA, PREPARADOS PARA BRISA
  const curtainMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f1e8,
    roughness: 0.88,
    metalness: 0.02,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const curtainGold = new THREE.MeshStandardMaterial({
    color: 0xc99548,
    metalness: 0.72,
    roughness: 0.38
  });

  const curtainWidth = 2.30;
  const curtainHeight = pillarTop - 0.38;

  for (let i = 0; i < 5; i++) {
    const current = vertices[i];
    const neighbors = [
      vertices[(i + 4) % 5],
      vertices[(i + 1) % 5]
    ];

    const cx = current.x * inset;
    const cz = current.y * inset;

    for (let side = 0; side < 2; side++) {
      const neighbor = neighbors[side];
      const nx = neighbor.x * inset;
      const nz = neighbor.y * inset;

      const dx = nx - cx;
      const dz = nz - cz;
      const length = Math.hypot(dx, dz);
      if (length < 0.01) continue;

      const ux = dx / length;
      const uz = dz / length;
      const width = Math.min(curtainWidth, length * 0.42);
      const startOffset = 0.10;
      const topY = pillarTop - 0.12;
      const cols = 20;
      const rows = 32;
      const positions = [];
      const indices = [];

      for (let r = 0; r <= rows; r++) {
        const v = r / rows;

        for (let c = 0; c <= cols; c++) {
          const u = c / cols;
          const fold = Math.sin(u * Math.PI * 10) * 0.035
                     + Math.sin(u * Math.PI * 20) * 0.014;
          const sway = Math.sin(v * Math.PI) * 0.018;

          const along = startOffset + u * width;
          positions.push(
            cx + ux * along - uz * (fold + sway),
            topY - v * curtainHeight,
            cz + uz * along + ux * (fold + sway)
          );
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const n = r * (cols + 1) + c;
          indices.push(
            n, n + cols + 1, n + 1,
            n + 1, n + cols + 1, n + cols + 2
          );
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const curtain = new THREE.Mesh(geometry, curtainMaterial);
      curtain.name = `curtain-${i}-${side}-wind-ready`;
      curtain.userData.windReady = true;

      // BRISA PROCEDURAL: la parte superior queda sujeta;
      // el movimiento aumenta hacia el borde inferior.
      const positionAttribute = geometry.attributes.position;
      const basePositions = positionAttribute.array.slice();
      const windX = -uz;
      const windZ = ux;

      curtain.onBeforeRender = () => {
        const t = performance.now() * 0.001;
        const array = positionAttribute.array;

        for (let r = 0; r <= rows; r++) {
          const v = r / rows;

          for (let c = 0; c <= cols; c++) {
            const u = c / cols;
            const index = (r * (cols + 1) + c) * 3;

            const wave =
              Math.sin(t * 1.65 - v * 4.2 + u * 2.8 + i * 1.7) * 0.19 +
              Math.sin(t * 1.05 - v * 2.6 - u * 4.0 + side) * 0.075 +
              Math.sin(t * 0.7 + u * 5.0 - v * 3.2 + i) * 0.045;

            const displacement = wave * v;

            array[index] = basePositions[index] + windX * displacement;
            array[index + 1] = basePositions[index + 1];
            array[index + 2] = basePositions[index + 2] + windZ * displacement;
          }
        }

        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
      };

      scene.add(curtain);

      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, width, 8),
        curtainGold
      );
      rod.position.set(
        cx + ux * (startOffset + width / 2),
        topY + 0.025,
        cz + uz * (startOffset + width / 2)
      );
      rod.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(ux, 0, uz).normalize()
      );
      scene.add(rod);
    }
  }
}
