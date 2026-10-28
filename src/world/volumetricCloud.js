import * as THREE from 'three/webgpu';

import {
  float,
  vec3,
  vec4,
  If,
  Break,
  Fn,
  smoothstep,
  texture3D,
  uniform
} from 'three/tsl';

import { RaymarchingBox } from
  'three/addons/tsl/utils/Raymarching.js';

import { ImprovedNoise } from
  'three/addons/math/ImprovedNoise.js';

export function createVolumetricCloud(scene) {
  // Textura 3D ligera para móviles: 64³ muestras.
  const size = 64;
  const data = new Uint8Array(size * size * size);
  const noise = new ImprovedNoise();
  const point = new THREE.Vector3();

  let index = 0;

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x - size / 2) / size;
        const ny = (y - size / 2) / size;
        const nz = (z - size / 2) / size;

        point.set(nx, ny, nz);

        // Forma general del cúmulo y erosión en varias escalas.
        const edge = Math.max(
          0,
          1 - point.length() * 1.65
        );

        const broad = noise.noise(
          x * 0.075, y * 0.075, z * 0.075
        );

        const detail = noise.noise(
          x * 0.16 + 19,
          y * 0.16 + 7,
          z * 0.16 - 13
        );

        const density = THREE.MathUtils.clamp(
          (0.58 + broad * 0.34 + detail * 0.12) *
          edge * edge * 2.8,
          0,
          1
        );

        data[index++] = Math.round(density * 255);
      }
    }
  }

  const texture = new THREE.Data3DTexture(
    data, size, size, size
  );

  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  // Azul frío de base: conserva la identidad cromática.
  const baseColor = uniform(new THREE.Color(0xd9eaff));
  const range = uniform(0.09);
  const threshold = uniform(0.27);
  const opacity = uniform(0.14);
  const steps = uniform(48);

  const cloudShader = Fn(() => {
    const result = vec4(0).toVar();

    RaymarchingBox(steps, ({ positionRay }) => {
      const samplePoint = positionRay.add(0.5);

      // Densidad original antes de aplicar transparencia.
      const rawDensity = texture3D(texture, null, 0)
        .sample(samplePoint).r;

      const density = float(rawDensity).toVar();

      density.assign(
        smoothstep(
          threshold.sub(range),
          threshold.add(range),
          density
        ).mul(opacity)
      );

      // Muestra desplazada hacia el sol, situado detrás de la nube.
      const lightSample = texture3D(texture, null, 0)
        .sample(
          samplePoint.add(vec3(0.0, 0.0, -0.035))
        ).r;

      // Detecta el borde orientado hacia la fuente de luz.
      const sunFacing = smoothstep(
        float(0.015),
        float(0.16),
        rawDensity.sub(lightSample)
      );

      // Sombreado original con variación vertical.
      const shade = lightSample
        .sub(density)
        .mul(2.0)
        .add(0.72)
        .add(positionRay.y.mul(0.20));

      // En los bordes iluminados aumenta el dorado y el coral.
      // En el interior se conserva una luz más fría y azulada.
      const litColor = vec3(
        shade.mul(float(0.82).add(sunFacing.mul(0.75))),
        shade.mul(float(0.90).sub(sunFacing.mul(0.24))),
        shade.mul(float(1.00).sub(sunFacing.mul(0.48)))
      );

      result.rgb.addAssign(
        result.a.oneMinus().mul(density).mul(litColor)
      );

      result.a.addAssign(
        result.a.oneMinus().mul(density)
      );

      If(result.a.greaterThanEqual(0.94), () => {
        Break();
      });
    });

    return result;
  });

  const material = new THREE.NodeMaterial();
  const volume = cloudShader();

  material.colorNode = volume.setRGB(
    volume.rgb.mul(baseColor)
  );

  material.side = THREE.BackSide;
  material.transparent = true;
  material.depthWrite = false;

  // Anillo volumétrico: todas las nubes comparten shader y textura.
  const cloudMeshes = [];
  const cloudCount = 16;
  const ringRadius = 28;
  const ringOffsetZ = -10;

  for (let i = 0; i < cloudCount; i++) {
    const angle = (i / cloudCount) * Math.PI * 2;
    const radius = ringRadius + Math.sin(i * 2.17) * 1.8;

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      material
    );

    mesh.name = `NUBE VOLUMÉTRICA TSL ${i + 1}`;
    mesh.position.set(
      Math.cos(angle) * radius,
      5.2 + Math.sin(angle * 2.0) * 1.1,
      Math.sin(angle) * radius + ringOffsetZ
    );
    mesh.rotation.y = angle + Math.PI / 2;
    mesh.scale.set(
      11.5 + 1.2 * Math.sin(i * 1.7),
      3.2 + 0.35 * Math.sin(i * 2.3),
      7.0 + 0.8 * Math.cos(i * 1.9)
    );

    mesh.frustumCulled = false;
    scene.add(mesh);
    cloudMeshes.push(mesh);
  }

  return {
    mesh: cloudMeshes[0],
    meshes: cloudMeshes,
    texture,
    material
  };
}
