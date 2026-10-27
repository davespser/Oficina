import * as THREE from 'three';

export function createLighting(scene) {
  // Luz ambiental: permite leer las sombras sin aplanar la escena.
  const ambientLight = new THREE.HemisphereLight(
    0x83bfff,
    0x08091c,
    1.5
  );

  // Luz principal cálida desde arriba y delante.
  const keyLight = new THREE.DirectionalLight(0xffd39a, 2.5);
  keyLight.position.set(3, 6, 5);

  // Luz azul frontal lateral: conserva la animación existente.
  const blueLight = new THREE.PointLight(0x087fff, 22, 16);
  blueLight.position.set(-3, 3, 2);

  // Rimlight cobalto desde atrás a la izquierda.
  const blueRimLeft = new THREE.PointLight(0x087fff, 35, 18);
  blueRimLeft.position.set(-4, 3.5, -3);

  // Segundo rimlight para separar los bordes del lado opuesto.
  const blueRimRight = new THREE.PointLight(0x168cff, 30, 18);
  blueRimRight.position.set(4, 3, -2);

  // Contraluz dorado para dar profundidad y contraste cromático.
  const goldLight = new THREE.PointLight(0xffbd58, 22, 18);
  goldLight.position.set(2, 4, -4);

  scene.add(
    ambientLight,
    keyLight,
    blueLight,
    blueRimLeft,
    blueRimRight,
    goldLight
  );

  return {
    ambientLight,
    keyLight,
    blueLight,
    blueRimLeft,
    blueRimRight,
    goldLight
  };
}
