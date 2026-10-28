import { createVolumetricCloud } from './volumetricCloud.js';
import * as THREE from 'three';

export function createLandscape(scene) {
  // MAR INFERIOR
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 320),
    new THREE.MeshStandardMaterial({
      color: 0x103b68,
      roughness: 0.38,
      metalness: 0.32,
      emissive: 0x061b36,
      emissiveIntensity: 0.35
    })
  );
  sea.name = 'OCÉANO INFERIOR';
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -2.2;
  scene.add(sea);

  // PEQUEÑAS ISLAS DE TIERRA
  const islandMaterial = new THREE.MeshStandardMaterial({
    color: 0x66564b,
    roughness: 0.94,
    metalness: 0.04
  });

  const islandTopMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b6758,
    roughness: 1
  });

  const islands = [
    [-8, -10, 2.8, 1.7],
    [7, -13, 3.1, 1.8],
    [12, -4, 2.4, 1.5],
    [-13, 2, 3.0, 1.9],
    [-4, -16, 2.1, 1.4],
    [15, -15, 2.7, 1.7],
    [2, 9, 2.4, 1.5],
    [-16, -10, 2.2, 1.4]
  ];

  islands.forEach(([x, z, rx, rz], i) => {
    const shape = new THREE.Shape();
    const count = 9;
    for (let j = 0; j < count; j++) {
      const a = (j / count) * Math.PI * 2;
      const irregular = 0.78 + 0.22 * Math.sin(j * 4.7 + i);
      const px = Math.cos(a) * rx * irregular;
      const py = Math.sin(a) * rz * irregular;
      if (j === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();

    const land = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      islandMaterial
    );
    land.rotation.x = -Math.PI / 2;
    land.position.set(x, -1.98, z);
    land.name = `ISLA ROCOSA ${i + 1}`;
    scene.add(land);

    const top = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      islandTopMaterial
    );
    top.scale.set(0.78, 0.78, 0.78);
    top.rotation.x = -Math.PI / 2;
    top.position.set(x, -1.93, z);
    scene.add(top);
  });

  // SOL DORADO: disco, dos halos y luz real.
  const sunOuterGlow = new THREE.Mesh(
    new THREE.SphereGeometry(13, 32, 24),
    new THREE.MeshBasicMaterial({
      color: 0xff8a24,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending
    })
  );
  sunOuterGlow.name = 'HALO EXTERIOR DEL SOL';
  sunOuterGlow.position.set(0, 4.2, -54);
  scene.add(sunOuterGlow);

  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 32, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffc247,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending
    })
  );
  sunGlow.name = 'RESPLANDOR DORADO DEL SOL';
  sunGlow.position.set(0, 4.2, -53);
  scene.add(sunGlow);

  const sunMaterial = new THREE.MeshStandardMaterial({
  color: 0xff6a16,
  emissive: 0xff4a08,
  emissiveIntensity: 40,
  roughness: 1,
  metalness: 0,
  toneMapped: false
});

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2.2, 48, 32),
  sunMaterial
);
sun.name = 'SOL EMISIVO';
sun.position.set(0, 3.2, -68);
scene.add(sun);

// Iluminación real del escenario: separada del material emisivo.
const sunLight = new THREE.DirectionalLight(0xff6a24, 12);
sunLight.name = 'LUZ SOLAR DEL ESCENARIO';
sunLight.position.copy(sun.position);
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight, sunLight.target);

  // ANILLO DE NUBES VOLUMÉTRICAS TSL.
  const volumetricCloud = createVolumetricCloud(scene);

  return {
    sea,
    sun,
    cloudMaterial: volumetricCloud.material,
    cloudShadeMaterial: volumetricCloud.material,
    volumetricCloud
  };
}
