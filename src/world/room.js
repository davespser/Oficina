import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
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



function hash(x, y, z, seed = 1) {
  const n = Math.sin(
    x * 127.1 + y * 311.7 + z * 74.7 + seed * 269.5
  ) * 43758.5453123;
  return (n - Math.floor(n)) * 2 - 1;
}

// Ruido continuo: evita que cada vértice parezca una astilla aislada.
function smoothNoise(x, y, z, seed = 1) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const fade = t => t * t * (3 - 2 * t);
  const u = fade(fx), v = fade(fy), w = fade(fz);
  const lerp = (a, b, t) => a + (b - a) * t;

  const a = lerp(
    hash(ix, iy, iz, seed),
    hash(ix + 1, iy, iz, seed), u
  );
  const b = lerp(
    hash(ix, iy + 1, iz, seed),
    hash(ix + 1, iy + 1, iz, seed), u
  );
  const c = lerp(
    hash(ix, iy, iz + 1, seed),
    hash(ix + 1, iy, iz + 1, seed), u
  );
  const d = lerp(
    hash(ix, iy + 1, iz + 1, seed),
    hash(ix + 1, iy + 1, iz + 1, seed), u
  );

  return lerp(lerp(a, b, v), lerp(c, d, v), w);
}

function createCarvedBlock(width, height, depth, seed = 1) {
  const geometry = new THREE.BoxGeometry(width, height, depth, 18, 18, 18);
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');

  const welded = mergeVertices(geometry, 0.0001);
  geometry.dispose();

  const pos = welded.attributes.position;
  const hx = width / 2, hy = height / 2, hz = depth / 2;
  const scale = Math.min(width, height, depth);
  const bevel = scale * 0.075;
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ax = Math.abs(x) / hx, ay = Math.abs(y) / hy, az = Math.abs(z) / hz;

    const bx = Math.max(0.001, hx - bevel);
    const by = Math.max(0.001, hy - bevel);
    const bz = Math.max(0.001, hz - bevel);

    const cx = clamp(x, bx), cy = clamp(y, by), cz = clamp(z, bz);
    let nx = x - cx, ny = y - cy, nz = z - cz;
    const len = Math.hypot(nx, ny, nz);

    if (len > 0.00001) {
      nx /= len; ny /= len; nz /= len;
    } else {
      const dominant = Math.max(ax, ay, az);
      nx = ax === dominant ? Math.sign(x) : 0;
      ny = ay === dominant && ay > ax ? Math.sign(y) : 0;
      nz = az === dominant && az > Math.max(ax, ay) ? Math.sign(z) : 0;
    }

    // Volumen principal: grandes masas, no ruido de superficie.
    const mega = smoothNoise(
      x * 0.32, y * 0.32, z * 0.32, seed + 100
    ) * scale * 0.105;

    // Formas secundarias y detalle subordinado.
    const broad = smoothNoise(
      x * 0.85, y * 0.85, z * 0.85, seed + 1
    ) * scale * 0.025;

    const medium = smoothNoise(
      x * 1.8, y * 1.8, z * 1.8, seed + 2
    ) * scale * 0.008;

    const fine = smoothNoise(
      x * 3.2, y * 3.2, z * 3.2, seed + 3
    ) * scale * 0.0015;

    // Fracturas anchas e irregulares, con profundidad limitada.
    const warp = smoothNoise(
      x * 0.55, y * 0.55, z * 0.55, seed + 10
    ) * 0.8;

    const lineA = Math.abs(Math.sin(
      x * 1.15 + z * 0.82 + warp + seed
    ));
    const lineB = Math.abs(Math.sin(
      y * 1.05 - z * 0.72 + warp * 0.7 + seed * 1.7
    ));

    const fractureA = Math.pow(
      Math.max(0, 1 - lineA / 0.12), 1.5
    );
    const fractureB = Math.pow(
      Math.max(0, 1 - lineB / 0.10), 1.5
    );

    const fracture = scale * (
      fractureA * 0.035 + fractureB * 0.022
    );

    // Astillas discretas: no deben dominar la lectura de la roca.
    const edgeFactor = THREE.MathUtils.smoothstep(
      Math.max(ax, ay, az), 0.82, 1.0
    );
    const chip = edgeFactor * smoothNoise(
      x * 2.0, y * 2.0, z * 2.0, seed + 20
    ) * scale * 0.008;

    // El volumen grande dirige la silueta; el microdetalle apenas interviene.
    const displacement = mega + broad + medium + fine + chip - fracture;

    pos.setXYZ(
      i,
      cx + nx * (bevel + displacement),
      cy + ny * (bevel + displacement),
      cz + nz * (bevel + displacement)
    );
  }

  pos.needsUpdate = true;
  const result = welded.toNonIndexed();
  welded.dispose();
  result.computeVertexNormals();
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

function createRock(width, height, depth, seed = 1) {
  return createCarvedBlock(width, height, depth, seed);
}


// Columna monolítica: superficie continua, perfil erosionado y sin juntas.
function createContinuousRockColumn(radius, height, seed = 1) {
  const around = 72;
  const levels = 112;
  const positions = [];
  const indices = [];

  const fract = n => n - Math.floor(n);
  const hash = (x, y, z) =>
    fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19)
      * 43758.5453) * 2 - 1;

  const fade = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  function noise(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const u = fade(x - ix), v = fade(y - iy), w = fade(z - iz);

    const a = lerp(hash(ix,iy,iz), hash(ix+1,iy,iz), u);
    const b = lerp(hash(ix,iy+1,iz), hash(ix+1,iy+1,iz), u);
    const c = lerp(hash(ix,iy,iz+1), hash(ix+1,iy,iz+1), u);
    const d = lerp(hash(ix,iy+1,iz+1), hash(ix+1,iy+1,iz+1), u);

    return lerp(lerp(a,b,v), lerp(c,d,v), w);
  }

  // Muescas asimétricas: algunas largas y diagonales, otras más erosionadas.
  const fractures = Array.from({ length: 8 }, (_, i) => ({
    angle: fract(Math.sin(seed * 17.13 + i * 71.7) * 19341.7)
      * Math.PI * 2,
    y: 0.08 + fract(Math.sin(seed * 7.7 + i * 31.1) * 8713.3) * 0.84,
    width: 0.10 + fract(Math.sin(seed + i * 23.9) * 713.1) * 0.16,
    tall: 0.045 + fract(Math.sin(seed + i * 43.3) * 931.7) * 0.12,
    slant: (fract(Math.sin(seed + i * 13.7) * 517.3) - 0.5) * 0.65,
    depth: 0.07 + fract(Math.sin(seed + i * 37.1) * 319.7) * 0.11
  }));

  for (let r = 0; r <= levels; r++) {
    const t0 = r / levels;

    for (let j = 0; j < around; j++) {
      const angle0 = j / around * Math.PI * 2;
      const ca0 = Math.cos(angle0);
      const sa0 = Math.sin(angle0);

      // Desplazamiento continuo en 3D; no se generan piezas apiladas.
      const broad = noise(ca0 * 2.6 + 5, t0 * 2.7 + 1, sa0 * 2.6 - 3);
      const medium = noise(ca0 * 5.2 - 8, t0 * 5.4 + 4, sa0 * 5.2 + 7);
      const fine = noise(ca0 * 10.5 + 11, t0 * 10.0 - 5, sa0 * 10.5 + 2);

      let radialCut = 0;
      for (const f of fractures) {
        let da = Math.atan2(
          Math.sin(angle0 - f.angle),
          Math.cos(angle0 - f.angle)
        );
        const localY = t0 - f.y - da * f.slant;
        const q = (da / f.width) ** 2 + (localY / f.tall) ** 2;

        if (q < 1) {
          const dent = f.depth * (1 - q) * (1 - q * 0.25);
          radialCut = Math.max(radialCut, dent);
        }
      }

      const taper = 1 - 0.055 * t0;
      const oval = 1
        + 0.10 * Math.sin(angle0 * 3 + seed * 0.71)
        + 0.045 * Math.cos(angle0 * 5 - seed * 0.37);

      const relief =
        broad * 0.20 +
        medium * 0.075 +
        fine * 0.022 -
        radialCut;

      const radial = radius * Math.max(0.58, taper * oval + relief);

      // También ondula la altura de cada vértice para evitar bandas horizontales.
      const yWarp = r === 0 || r === levels ? 0 :
        noise(ca0 * 3.7 + 12, t0 * 4.3 + 6, sa0 * 3.7 - 9)
        * radius * 0.075;

      const cx = radius * 0.055 * noise(4, t0 * 2.1 + seed, 8);
      const cz = radius * 0.055 * noise(9, t0 * 2.4, seed + 3);

      positions.push(
        cx + Math.cos(angle0) * radial,
        Math.max(0, Math.min(height, t0 * height + yWarp)),
        cz + Math.sin(angle0) * radial
      );
    }
  }

  for (let r = 0; r < levels; r++) {
    for (let j = 0; j < around; j++) {
      const n = (j + 1) % around;
      const a = r * around + j;
      const b = r * around + n;
      const c = (r + 1) * around + n;
      const d = (r + 1) * around + j;
      indices.push(a, d, b, b, d, c);
    }
  }

  const bottom = positions.length / 3;
  positions.push(0, 0, 0);
  const top = positions.length / 3;
  positions.push(0, height, 0);

  for (let j = 0; j < around; j++) {
    const n = (j + 1) % around;
    indices.push(bottom, j, n);
    const last = levels * around;
    indices.push(top, last + n, last + j);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

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
  const radius = 5;
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

  const stone = createStoneMaterial();
  const templeHeight = 5.4;
  const pillarSize = 0.82;
  const beamHeight = 0.9;
  const beamDepth = 0.92;
  const inset = 0.88;
  const pillarTop = templeHeight - beamHeight;

  // Cinco columnas monolíticas: una sola malla irregular por pilar.
  for (let i = 0; i < 5; i++) {
    const v = vertices[i];
    const geometry = createContinuousRockColumn(
      pillarSize * 0.5,
      pillarTop,
      100 + i * 19
    );

    const pillar = new THREE.Mesh(geometry, stone);
    pillar.position.set(v.x * inset, 0, v.y * inset);
    scene.add(pillar);
  }


// CORTINAS LATERALES, DOS PAÑOS POR COLUMNA, PREPARADOS PARA BRISA
const curtainMaterial = new THREE.MeshStandardMaterial({
  color: 0x10284b,
  roughness: 0.84,
  metalness: 0.06,
  side: THREE.DoubleSide
});

const curtainGold = new THREE.MeshStandardMaterial({
  color: 0xc99548,
  metalness: 0.72,
  roughness: 0.38
});

const curtainWidth = 1.15;
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

  for (let i = 0; i < 5; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % 5];
    const line = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x * inset, 0.025, a.y * inset),
      new THREE.Vector3(b.x * inset, 0.025, b.y * inset)
    ]);
    scene.add(new THREE.Line(line, i % 2 === 0 ? blue : gold));
  }

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
