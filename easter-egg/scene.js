export function setupMiniScene(THREE, camera) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050b19);
  scene.fog = new THREE.Fog(0x050b19, 2, 6);

  camera.position.set(0, 0.1, 0);
  camera.lookAt(new THREE.Vector3(0, 0.1, -1));

  const ambient = new THREE.AmbientLight(0x4d6cff, 0.35);
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(0.8, 1.6, 0.4);
  const fill = new THREE.PointLight(0x5cc4ff, 1.0, 6);
  fill.position.set(-0.6, 0.9, -0.2);
  const rim = new THREE.PointLight(0xff758c, 0.6, 4);
  rim.position.set(0.3, 0.4, -1.2);
  scene.add(ambient, key, fill, rim);

  const grid = new THREE.GridHelper(4, 24, 0x4261c9, 0x152447);
  grid.position.y = -0.36;
  scene.add(grid);

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x081125,
    roughness: 0.9,
    metalness: 0.05
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.37;
  scene.add(floor);

  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x0e1b3a,
    wireframe: true,
    transparent: true,
    opacity: 0.12
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(2.5, 24, 16), atmosphereMaterial);
  scene.add(atmosphere);

  const dynamics = [];

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0xf8b05c, roughness: 0.35, metalness: 0.2 })
  );
  sphere.position.set(0.28, 0.05, -0.55);
  scene.add(sphere);
  dynamics.push({ mesh: sphere, rotateAxis: new THREE.Vector3(0, 1, 0), rotateSpeed: 0.3, bobAmplitude: 0.03, bobSpeed: 1.6 });

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x6da8ff, roughness: 0.4, metalness: 0.25 })
  );
  cube.position.set(-0.24, 0.02, -0.42);
  scene.add(cube);
  dynamics.push({
    mesh: cube,
    rotateAxis: new THREE.Vector3(1, 1, 0).normalize(),
    rotateSpeed: 0.45,
    bobAmplitude: 0.02,
    bobSpeed: 1.2
  });

  const pyramid = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.22, 4),
    new THREE.MeshStandardMaterial({ color: 0xc675ff, roughness: 0.3, metalness: 0.4 })
  );
  pyramid.position.set(0.02, -0.1, -0.28);
  pyramid.rotation.y = Math.PI / 4;
  scene.add(pyramid);
  dynamics.push({ mesh: pyramid, rotateAxis: new THREE.Vector3(0, 1, 0), rotateSpeed: -0.35, bobAmplitude: 0.025, bobSpeed: 1.9 });

  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.42, 12),
    new THREE.MeshStandardMaterial({ color: 0x8ae0d6, roughness: 0.5, metalness: 0.1 })
  );
  pillar.position.set(-0.05, -0.14, -0.85);
  scene.add(pillar);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xff6d92, emissive: 0x551126, emissiveIntensity: 0.6, roughness: 0.25 })
  );
  orb.position.set(-0.18, 0.22, -0.65);
  scene.add(orb);
  dynamics.push({ mesh: orb, rotateAxis: new THREE.Vector3(0, 1, 0), rotateSpeed: 0.6, bobAmplitude: 0.05, bobSpeed: 2.3 });

  dynamics.forEach(obj => {
    obj.baseY = obj.mesh.position.y;
  });

  const labels = new THREE.Group();
  const labelMaterial = new THREE.LineBasicMaterial({ color: 0x3b5aa8 });
  const labelGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -0.35, -0.35),
    new THREE.Vector3(0, -0.35, -0.75)
  ]);
  const forward = new THREE.Line(labelGeometry, labelMaterial);
  labels.add(forward);
  const pole = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x3b5aa8, roughness: 0.6 })
  );
  pole.position.set(0, -0.31, -0.75);
  labels.add(pole);
  scene.add(labels);

  const initialPosition = new THREE.Vector3(0, 0.1, 0);

  return { scene, dynamics, initialPosition };
}
