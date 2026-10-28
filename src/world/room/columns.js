import * as THREE from 'three';
import { createContinuousRockColumn } from './stoneGeometry.js';

export function createColumns(
  scene,
  vertices,
  stone,
  inset,
  pillarTop,
  pillarSize
) {
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
}
