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


  // HORIZONTE DE MUNDOS IMPOSIBLES
  // Cordilleras colosales, agujas minerales y arcos monumentales.

  const horizonGroup = new THREE.Group();
  horizonGroup.name = 'HORIZONTE DE MUNDOS IMPOSIBLES';
  scene.add(horizonGroup);

  const farRock = new THREE.MeshStandardMaterial({
    color: 0x343c55,
    roughness: 0.94,
    metalness: 0.08,
    emissive: 0x10172b,
    emissiveIntensity: 0.35,
    flatShading: false
  });

  const middleRock = new THREE.MeshStandardMaterial({
    color: 0x65505a,
    roughness: 0.92,
    metalness: 0.06,
    emissive: 0x241827,
    emissiveIntensity: 0.22,
    flatShading: false
  });

  const distantRock = new THREE.MeshStandardMaterial({
    color: 0x77788c,
    roughness: 1,
    flatShading: false
  });

  const goldEdge = new THREE.MeshBasicMaterial({
    color: 0xffbd70,
    toneMapped: false
  });


  // Cumbres erosionadas con variación orgánica de la superficie.
  function createErodedPeak(radius, height, seed) {
    const geometry = new THREE.ConeGeometry(
      radius, height, 28, 9
    );
    const positions = geometry.attributes.position;

    for (let v = 0; v < positions.count; v++) {
      const x = positions.getX(v);
      const y = positions.getY(v);
      const z = positions.getZ(v);

      const wave =
        Math.sin(x * 0.72 + seed * 2.1) *
        Math.cos(z * 0.81 - seed) +
        0.45 * Math.sin((x + z) * 1.35 + seed * 3.7);

      const factor = 1 + wave * 0.105;

      positions.setX(v, x * factor);
      positions.setZ(v, z * factor);

      // Rugosidad natural sin destruir la silueta de la cumbre.
      positions.setY(
        v,
        y + wave * radius * 0.035
      );
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  // Cordilleras irregulares en varias capas.
  // Las posiciones están repartidas para permitir girar la cámara.
  const ranges = [
    { radius: 76, count: 15, height: 7, spread: 8, material: middleRock },
    { radius: 105, count: 19, height: 10, spread: 12, material: farRock },
    { radius: 138, count: 23, height: 13, spread: 16, material: distantRock }
  ];

  ranges.forEach((range, layer) => {
    for (let i = 0; i < range.count; i++) {
      const angle = (i / range.count) * Math.PI * 2
        + layer * 0.19;

      const radius = range.radius
        + Math.sin(i * 2.37 + layer) * range.spread;

      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius;

      const h = range.height * (
        0.48 + 0.52 * (0.5 + 0.5 * Math.sin(i * 4.17 + layer))
      );

      const r = h * (0.40 + 0.18 * (0.5 + 0.5 * Math.sin(i * 3.1)));

      const mountain = new THREE.Mesh(
        createErodedPeak(r, h, i + layer * 17),
        range.material
      );

      mountain.position.set(x, -2.3 + h * 0.48, z);
      mountain.rotation.y = i * 1.73;
      mountain.rotation.z = Math.sin(i * 2.2) * 0.12;
      mountain.scale.set(
        0.85 + (i % 4) * 0.16,
        1,
        0.8 + (i % 3) * 0.18
      );
      mountain.name = `MONTAÑA IMPOSIBLE ${layer + 1}-${i + 1}`;
      horizonGroup.add(mountain);
    }
  });

  // Grandes agujas que rompen la silueta del horizonte.
  for (let i = 0; i < 7; i++) {
    const angle = -0.9 + i * 0.3;
    const radius = 78 + (i % 3) * 8;
    const height = 7 + (i % 4) * 2;

    const spire = new THREE.Mesh(
      createErodedPeak(1.3 + (i % 2) * 0.4, height, i + 40),
      middleRock
    );

    spire.position.set(
      Math.sin(angle) * radius,
      height * 0.42,
      -Math.cos(angle) * radius
    );
    spire.rotation.z = (i % 2 ? 1 : -1) * 0.16;
    horizonGroup.add(spire);
  }

  // Arcos gigantes suspendidos entre tierras lejanas.
  function addImpossibleArch(x, y, z, width, height, material) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - width / 2, y, z),
      new THREE.Vector3(x - width * 0.40, y + height * 0.55, z),
      new THREE.Vector3(x - width * 0.20, y + height, z),
      new THREE.Vector3(x, y + height * 1.08, z),
      new THREE.Vector3(x + width * 0.20, y + height, z),
      new THREE.Vector3(x + width * 0.40, y + height * 0.55, z),
      new THREE.Vector3(x + width / 2, y, z)
    ]);

    const arch = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.48, 8, false),
      material
    );

    arch.name = 'ARCO MONUMENTAL DEL HORIZONTE';
    horizonGroup.add(arch);

    // Fina línea dorada siguiendo el borde interior del arco.
    const edgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - width * 0.46, y + 0.15, z - 0.22),
      new THREE.Vector3(x - width * 0.35, y + height * 0.57, z - 0.22),
      new THREE.Vector3(x - width * 0.17, y + height * 0.91, z - 0.22),
      new THREE.Vector3(x, y + height * 0.98, z - 0.22),
      new THREE.Vector3(x + width * 0.17, y + height * 0.91, z - 0.22),
      new THREE.Vector3(x + width * 0.35, y + height * 0.57, z - 0.22),
      new THREE.Vector3(x + width * 0.46, y + 0.15, z - 0.22)
    ]);

    horizonGroup.add(new THREE.Mesh(
      new THREE.TubeGeometry(edgeCurve, 64, 0.035, 6, false),
      goldEdge
    ));
  }

  addImpossibleArch(0, 0.5, -105, 19, 7, middleRock);
  addImpossibleArch(-53, 0, -125, 14, 8, farRock);
  addImpossibleArch(58, 0, -132, 16, 9, farRock);

  // Continentes invertidos suspendidos sobre el horizonte.
  const floatingRock = new THREE.MeshStandardMaterial({
    color: 0x4a465c,
    roughness: 0.9,
    flatShading: false
  });

  [
    [-35, 10, -91, 7, 5],
    [38, 12, -101, 8, 6],
    [-67, 14, -119, 9, 6],
    [72, 15, -127, 8, 6]
  ].forEach(([x, y, z, width, depth], i) => {
    const island = new THREE.Mesh(
      createErodedPeak(width, depth * 1.8, i + 80),
      floatingRock
    );

    island.position.set(x, y, z);
    island.rotation.z = Math.PI;
    island.rotation.y = i * 0.8;
    island.scale.set(1.25, 1, 0.85);
    island.name = `CONTINENTE INVERTIDO ${i + 1}`;
    horizonGroup.add(island);

    // Estrías minerales doradas en la base suspendida.
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(width * 0.55, 0.025, 5, 48),
      goldEdge
    );

    ridge.position.set(x, y - depth * 0.38, z);
    ridge.rotation.x = Math.PI / 2;
    ridge.scale.set(1, 0.72, 1);
    horizonGroup.add(ridge);
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
