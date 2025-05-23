import * as THREE from 'three';
import { scene } from './sceneSetup.js';  // Importa a cena

import KeyboardState from '../libs/util/KeyboardState.js';
import { PointerLockControls } from './PointerLockControls_Trabalho.js';
import {
  initRenderer,
  onWindowResize
} from "../libs/util/util.js";

let renderer = initRenderer();
let keyboard = new KeyboardState();

// Câmera
let camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
let camPos = new THREE.Vector3(0, 2.0, 0);
let camUp = new THREE.Vector3(0.0, 1.0, 0.0);
let camLook = new THREE.Vector3(0.0, 2.0, 0.0);
camera.position.copy(camPos);
camera.up.copy(camUp);
camera.lookAt(camLook);

let cameraHolder = new THREE.Object3D();
cameraHolder.add(camera);
scene.add(cameraHolder);

const controls = new PointerLockControls(camera, renderer.domElement);
renderer.domElement.addEventListener('click', () => {
  controls.lock();
}, false);

// objetos visuais da câmera (cilindro, esfera)
var cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 25);
var cylinderMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(100,255,100)' });
var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.rotation.x = Math.PI / 2;
cylinder.position.set(0, -0.2, -0.7);

var sphGeo = new THREE.SphereGeometry(0.1, 40, 40);
var sphereMaterial = new THREE.MeshPhongMaterial({ color: 'red' });
var sphere = new THREE.Mesh(sphGeo, sphereMaterial);
sphere.position.set(0, -1, 0.0);

cylinder.add(sphere);
camera.add(cylinder);

window.addEventListener('resize', () => onWindowResize(camera, renderer), false);

function keyboardUpdate() {
  keyboard.update();
  const moveSpeed = 1;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  const side = new THREE.Vector3();
  side.crossVectors(camera.up, direction).normalize();

  if (keyboard.pressed("W") || keyboard.pressed("up")) {
    cameraHolder.position.addScaledVector(direction, moveSpeed);
  }
  if (keyboard.pressed("S") || keyboard.pressed("down")) {
    cameraHolder.position.addScaledVector(direction, -moveSpeed);
  }
  if (keyboard.pressed("A") || keyboard.pressed("left")) {
    cameraHolder.position.addScaledVector(side, moveSpeed);
  }
  if (keyboard.pressed("D") || keyboard.pressed("right")) {
    cameraHolder.position.addScaledVector(side, -moveSpeed);
  }
}

function render() {
  requestAnimationFrame(render);
  keyboardUpdate();
  renderer.render(scene, camera);
}

export { scene, camera, cameraHolder, renderer, controls, keyboardUpdate, render };
