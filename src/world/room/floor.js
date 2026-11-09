import * as THREE from 'three';

export function createRoomFloor(scene, vertices, inset) {
  const textureLoader = new THREE.TextureLoader();

  function createPlaceholderTexture(r, g, b) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 1, 1);

    return new THREE.Texture(canvas);
  }

  const baseColor = createPlaceholderTexture(128, 128, 128);
  const normal = createPlaceholderTexture(128, 128, 255);
  const roughness = createPlaceholderTexture(255, 255, 255);

  function configureTexture(texture, colorSpace = THREE.NoColorSpace) {
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.5, 0.5);
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }

  configureTexture(baseColor, THREE.SRGBColorSpace);
  configureTexture(normal);
  configureTexture(roughness);

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: baseColor,
    normalMap: normal,
    roughnessMap: roughness,
    normalScale: new THREE.Vector2(0.45, 0.45),
    metalness: 0.04,
    roughness: 0.82
  });

  function loadTexture(url, property, colorSpace) {
    textureLoader.load(
      url,
      (loaded) => {
        configureTexture(loaded, colorSpace);
        floorMaterial[property] = loaded;
        floorMaterial.needsUpdate = true;
      },
      undefined,
      (error) => console.error('Error cargando textura del suelo:', url, error)
    );
  }

  loadTexture(
    '/assets/materials-pbr/pbr-texture-base-color.png.jpg',
    'map',
    THREE.SRGBColorSpace
  );
  loadTexture(
    '/assets/materials-pbr/pbr-texture-normal.png.jpg',
    'normalMap'
  );
  loadTexture(
    '/assets/materials-pbr/pbr-texture-roughness.png.jpg',
    'roughnessMap'
  );

  const blue = new THREE.LineBasicMaterial({
    color: 0x087fff
  });

  const gold = new THREE.LineBasicMaterial({
    color: 0xffc45c
  });

  const shape = new THREE.Shape();
  shape.moveTo(vertices[0].x, vertices[0].y);

  for (let i = 1; i < 5; i++) {
    shape.lineTo(vertices[i].x, vertices[i].y);
  }

  shape.closePath();

  const floor = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    floorMaterial
  );

  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Se conservan las líneas pentagonales azules y doradas.
  for (let i = 0; i < 5; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % 5];

    const line = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x * inset, 0.025, a.y * inset),
      new THREE.Vector3(b.x * inset, 0.025, b.y * inset)
    ]);

    scene.add(
      new THREE.Line(line, i % 2 === 0 ? blue : gold)
    );
  }

  return {
    floor,
    floorMaterial,
    baseColor,
    normal,
    roughness,
    blue,
    gold
  };
}
