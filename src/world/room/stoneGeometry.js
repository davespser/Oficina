import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

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

export function createRock(width, height, depth, seed = 1) {
  return createCarvedBlock(width, height, depth, seed);
}


// Columna monolítica: superficie continua, perfil erosionado y sin juntas.
export function createContinuousRockColumn(radius, height, seed = 1) {
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
