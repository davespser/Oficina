import * as THREE from 'three';

export function createSky(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);

  gradient.addColorStop(0.00, '#07152f');
  gradient.addColorStop(0.20, '#173b78');
  gradient.addColorStop(0.36, '#514477');
  gradient.addColorStop(0.45, '#bd6570');
  gradient.addColorStop(0.50, '#ffb45f');
  gradient.addColorStop(0.54, '#ffe0a0');
  gradient.addColorStop(0.59, '#e87542');
  gradient.addColorStop(0.70, '#64384f');
  gradient.addColorStop(1.00, '#10172e');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);

  const glow = ctx.createRadialGradient(512, 258, 8, 512, 258, 190);
  glow.addColorStop(0, 'rgba(255,226,157,0.95)');
  glow.addColorStop(0.22, 'rgba(255,165,87,0.48)');
  glow.addColorStop(1, 'rgba(255,118,74,0)');

  ctx.fillStyle = glow;
  ctx.fillRect(280, 80, 464, 360);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(80, 48, 32),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
      toneMapped: false
    })
  );

  sky.name = 'CIELO DE ATARDECER';
  sky.renderOrder = -1000;
  scene.add(sky);

  return sky;
}
