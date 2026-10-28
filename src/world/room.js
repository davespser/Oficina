import * as THREE from 'three';
import { createRock } from './room/stoneGeometry.js';
import { createColumns } from './room/columns.js';
import { createCurtains } from './room/curtains.js';
import { createArchitecturalTrim } from './room/trim.js';
import { createPanoramicWindows } from './room/windows.js';
import { createRoomFloor } from './room/floor.js';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
  positionLocal,
  mx_noise_float,
  mix,
  vec3,
  float,
  smoothstep
} from 'three/tsl';

/*
 * TEMPLO MEGALÍTICO PENTAGONAL
 * Pilares de roca natural tallada y dinteles monolíticos.
 * Geometría irregular, silueta pétrea, fracturas y erosión.
 */



function createStoneMaterial() {
  const mat = new MeshStandardNodeMaterial({
    color: 0x432819,
    metalness: 0,
    roughness: 0.82
  });

  const p = positionLocal;

  // TSL: ruido procedural a varias escalas.
  const large = mx_noise_float(p.mul(1.2));
  const strata = mx_noise_float(
    vec3(p.x.mul(2.6), p.y.mul(7.5), p.z.mul(2.6))
  );
  const mineral = mx_noise_float(p.mul(6.5));
  const grain = mx_noise_float(p.mul(19.0));
  const cavities = mx_noise_float(p.mul(11.0));

  const a = large.mul(0.5).add(0.5);
  const b = strata.mul(0.5).add(0.5);
  const c = mineral.mul(0.5).add(0.5);
  const d = grain.mul(0.5).add(0.5);
  const e = cavities.mul(0.5).add(0.5);

  // Cavidades y variación cromática de la roca.
  const cavityMask = smoothstep(float(0.12), float(0.4), e);
  const darkening = mix(float(0.48), float(1.0), cavityMask);

  const deep = vec3(0.018, 0.009, 0.006);
  const shadow = vec3(0.065, 0.027, 0.014);
  const brown = vec3(0.17, 0.069, 0.031);
  const mineralBrown = vec3(0.25, 0.13, 0.064);

  const base = mix(deep, shadow, a);
  const body = mix(base, brown, b.mul(0.75));
  const tint = mix(body, mineralBrown, c.mul(0.24));

  // Inclusiones minerales frías, integradas en la piedra.
  const veinField = c.mul(0.7).add(b.mul(0.3));
  const veins = smoothstep(float(0.76), float(0.91), veinField);
  const cobalt = vec3(0.025, 0.075, 0.14);
  const mineralTint = mix(tint, cobalt, veins.mul(0.22));

  // Grano fino y rugosidad generados en el shader.
  const fine = mix(float(0.82), float(1.12), d);
  mat.colorNode = mineralTint.mul(fine).mul(darkening);

  mat.roughnessNode = mix(
    float(0.68),
    float(0.96),
    c.mul(0.35).add(b.mul(0.35)).add(d.mul(0.3))
  );

  mat.metalness = 0;
  return mat;
}

export function createRoom(scene) {
  const radius = 10;
  const vertices = [];

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    vertices.push(new THREE.Vector2(Math.sin(a) * radius, Math.cos(a) * radius));
  }

  const metal = new THREE.MeshStandardMaterial({
    color: 0x101827,
    metalness: 0.85,
    roughness: 0.3
  });

  const stone = createStoneMaterial();
  const templeHeight = 5.4;
  const pillarSize = 0.82;
  const beamHeight = 0.9;
  const beamDepth = 0.92;
  const inset = 0.88;
  const pillarTop = templeHeight - beamHeight;

  createColumns(
    scene,
    vertices,
    stone,
    inset,
    pillarTop,
    pillarSize
  );



  // Cortinas de gasa blanca con brisa procedural.
  createCurtains(scene, vertices, inset, pillarTop);

  createArchitecturalTrim(
    scene, vertices, inset, pillarSize, pillarTop, beamHeight, beamDepth, stone, templeHeight
  );

// ZOCALO INFERIOR DE PIEDRA: cierra la base sin bloquear los miradores.
  const lowerBeamHeight = 0.72;
  const lowerBeamDepth = beamDepth;

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
    const beamLength = edgeLength + pillarSize * 0.75;

    const lowerBeam = new THREE.Mesh(
      createRock(beamLength, lowerBeamHeight, lowerBeamDepth, 400 + i),
      stone
    );

    lowerBeam.position.set(
      (ax + bx) / 2,
      lowerBeamHeight / 2,
      (az + bz) / 2
    );
    lowerBeam.rotation.y = Math.atan2(-dz, dx);
    scene.add(lowerBeam);
  }

    createPanoramicWindows(
    scene, vertices, inset, pillarSize, pillarTop, lowerBeamHeight
  );

  createRoomFloor(scene, vertices, inset);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.65, 0.12, 64),
    metal
  );
  platform.position.y = 0.09;
  scene.add(platform);

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

  const platformLight = new THREE.PointLight(0x38cfff, 12, 5, 2);
  platformLight.position.set(0, 0.42, 0);
  scene.add(platformLight);

  return { vertices, platform, platformRing, platformHalo, platformLight };
}
