import * as THREE from 'three';

export function createLighting(scene) {
  const ambientLight = new THREE.HemisphereLight(
    0xffc58e, 0x11152c, 1.7
  );


  const coralLight = new THREE.PointLight(0xff704e, 12, 22, 2);
  coralLight.position.set(0, 2.5, -5);

  const blueLight = new THREE.PointLight(0x087fff, 22, 16);
  blueLight.position.set(-3, 3, 2);

  const blueRimLeft = new THREE.PointLight(0x087fff, 35, 18);
  blueRimLeft.position.set(-4, 3.5, -3);

  const blueRimRight = new THREE.PointLight(0x168cff, 30, 18);
  blueRimRight.position.set(4, 3, -2);

  const goldLight = new THREE.PointLight(0xffbd58, 22, 18);
  goldLight.position.set(2, 4, -4);

  scene.add(
    ambientLight,
    coralLight,
    blueLight,
    blueRimLeft,
    blueRimRight,
    goldLight
  );

  return {
    ambientLight,
    coralLight,
    blueLight,
    blueRimLeft,
    blueRimRight,
    goldLight
  };
}
