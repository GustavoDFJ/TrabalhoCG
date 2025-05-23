import * as THREE from 'three';
import { createGroundPlaneXZ } from "../libs/util/util.js";

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Luz ambiente para iluminação geral
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Luz direcional para sombras e iluminação mais definida
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;  // sombras de boa qualidade
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 100;
scene.add(directionalLight);

// Chão
const floor = createGroundPlaneXZ(500, 500);
floor.receiveShadow = true;
scene.add(floor);

// Paredes
let wallGeometry = new THREE.BoxGeometry(500, 10, 1);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

let wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.set(0, 5, 249.5);
wall.castShadow = true;
wall.receiveShadow = true;
scene.add(wall);

wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.set(0, 5, -249.5);
wall.castShadow = true;
wall.receiveShadow = true;
scene.add(wall);

wallGeometry = new THREE.BoxGeometry(1, 10, 500);
wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.set(249.5, 5, 0);
wall.castShadow = true;
wall.receiveShadow = true;
scene.add(wall);

wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.set(-249.5, 5, 0);
wall.castShadow = true;
wall.receiveShadow = true;
scene.add(wall);

function addShadowProps(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

export function createSceneObjects() {
  // Área 1
  let areaGeometry = new THREE.BoxGeometry(120, 1.60, 116);
  let areaMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 });
  let build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(-155, 0.8, -157);
  addShadowProps(build);
  scene.add(build);

  areaGeometry = new THREE.BoxGeometry(35, 1.60, 4.5);
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(-112.5, 0.8, -97.25);
  addShadowProps(build);
  scene.add(build);

  areaGeometry = new THREE.BoxGeometry(75, 1.60, 4.5);
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(-177.5, 0.8, -97.25);
  addShadowProps(build);
  scene.add(build);

  let stepSize = { x: 10, y: .2, z: .5 };
  let steps = 8;
  let angle = Math.PI;
  let position = new THREE.Vector3(-135, 0, -95);

  let stair = staircase(stepSize, steps, angle, position, areaMaterial);
  addShadowProps(stair);
  scene.add(stair);

  // Área 2
  areaGeometry = new THREE.BoxGeometry(120, 1.60, 116);
  areaMaterial = new THREE.MeshStandardMaterial({ color: 0x4682b4 });
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(0, 0.8, -157);
  addShadowProps(build);
  scene.add(build);

  areaGeometry = new THREE.BoxGeometry(35, 1.60, 4.5);
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(42.5, 0.8, -97.25);
  addShadowProps(build);
  scene.add(build);

  areaGeometry = new THREE.BoxGeometry(75, 1.60, 4.5);
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(-22.5, 0.8, -97.25);
  addShadowProps(build);
  scene.add(build);

  stepSize = { x: 10, y: .2, z: .5 };
  steps = 8;
  angle = Math.PI;
  position = new THREE.Vector3(20, 0, -95);

  stair = staircase(stepSize, steps, angle, position, areaMaterial);
  addShadowProps(stair);
  scene.add(stair);

  // Área 3
  areaGeometry = new THREE.BoxGeometry(120, 1.60, 116);
  areaMaterial = new THREE.MeshStandardMaterial({ color: 0x6b8e23 });
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(155, 0.8, -157);
  addShadowProps(build);
  scene.add(build);

  areaGeometry = new THREE.BoxGeometry(55, 1.60, 4.5);
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(187.5, 0.8, -97.25);
  addShadowProps(build);
  scene.add(build);

  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(122.5, 0.8, -97.25);
  addShadowProps(build);
  scene.add(build);

  stepSize = { x: 10, y: .2, z: .5 };
  steps = 8;
  angle = Math.PI;
  position = new THREE.Vector3(155, 0, -95);

  stair = staircase(stepSize, steps, angle, position, areaMaterial);
  addShadowProps(stair);
  scene.add(stair);

  // Área 4
  areaGeometry = new THREE.BoxGeometry(310, 1.60, 116);
  areaMaterial = new THREE.MeshStandardMaterial({ color: 0xffb90f });
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(0, 0.8, 157);
  addShadowProps(build);
  scene.add(build);

  areaGeometry = new THREE.BoxGeometry(150, 1.60, 4.5);
  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(-80, 0.8, 97.25);
  addShadowProps(build);
  scene.add(build);

  build = new THREE.Mesh(areaGeometry, areaMaterial);
  build.position.set(80, 0.8, 97.25);
  addShadowProps(build);
  scene.add(build);

  stepSize = { x: 10, y: .2, z: .5 };
  steps = 8;
  angle = 0;
  position = new THREE.Vector3(0, 0, 95);

  stair = staircase(stepSize, steps, angle, position, areaMaterial);
  addShadowProps(stair);
  scene.add(stair);
}

function staircase(stepSize, numSteps, angle, position, material) {
  const staircase = new THREE.Group();
  staircase.position.copy(position);
  staircase.rotation.y = angle;

  for (let i = 0; i < numSteps; i++) {
    const stepGeometry = new THREE.BoxGeometry(stepSize.x, stepSize.y, stepSize.z);
    const step = new THREE.Mesh(stepGeometry, material);
    step.position.set(0, (i + 0.5) * stepSize.y, (i + 0.5) * stepSize.z);
    step.castShadow = true;
    step.receiveShadow = true;
    staircase.add(step);
  }

  return staircase;
}
