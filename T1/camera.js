// Importa a biblioteca principal Three.js
import * as THREE from 'three';

// Importa a cena e os objetos que podem colidir (paredes, obstáculos, escadas)
import { scene, collidableMeshes, stairMeshes } from './sceneSetup.js';

// Importa utilitário para gerenciar o estado do teclado
import KeyboardState from '../libs/util/KeyboardState.js';

// Importa os controles de movimento baseados em bloqueio de cursor
import { PointerLockControls } from './PointerLockControls_Trabalho.js';

// Importa funções utilitárias: inicialização do renderizador e ajuste de tamanho da janela
import {
  initRenderer,
  onWindowResize
} from "../libs/util/util.js";

let renderer = initRenderer();
let keyboard = new KeyboardState();

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.0, 0);
camera.up.set(0.0, 1.0, 0.0);
camera.lookAt(new THREE.Vector3(0.0, 2.0, 0.0));

let cameraHolder = new THREE.Object3D();
cameraHolder.add(camera);
scene.add(cameraHolder);

const controls = new PointerLockControls(camera, renderer.domElement);
renderer.domElement.addEventListener('click', () => controls.lock(), false);
window.addEventListener('resize', () => onWindowResize(camera, renderer), false);

function checkCollision(nextPos, tryStep = true) {
  const playerHeight = 2.0;
  const playerSize = new THREE.Vector3(1.0, playerHeight, 1.0);

  const originalBox = new THREE.Box3().setFromCenterAndSize(
    nextPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),
    playerSize
  );

  for (const mesh of collidableMeshes) {
    const meshBox = new THREE.Box3().setFromObject(mesh);
    if (originalBox.intersectsBox(meshBox)) {
      const isStair = stairMeshes.includes(mesh);
      if (!isStair || !tryStep) return true;

      const maxStepHeight = 1;
      const stepIncrement = 0.1;

      for (let step = stepIncrement; step <= maxStepHeight; step += stepIncrement) {
        const stepPos = nextPos.clone().add(new THREE.Vector3(0, step, 0));
        const stepBox = new THREE.Box3().setFromCenterAndSize(
          stepPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),
          playerSize
        );

        let blocked = false;
        for (const mesh of collidableMeshes) {
          const meshBox = new THREE.Box3().setFromObject(mesh);
          if (stepBox.intersectsBox(meshBox)) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          nextPos.y += step;
          return { allowed: true, pos: nextPos };
        }
      }
      return true;
    }
  }
  return false;
}

function keyboardUpdate() {
  keyboard.update();
  const moveSpeed = 1;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  const side = new THREE.Vector3();
  side.crossVectors(camera.up, direction).normalize();

  function tryMove(moveVec) {
    const originalPos = cameraHolder.position.clone();
    const attemptedPos = originalPos.clone().addScaledVector(moveVec, moveSpeed);

    const fullMoveResult = checkCollision(attemptedPos, true);
    if (fullMoveResult === false) {
      cameraHolder.position.copy(attemptedPos);
      return true;
    } else if (fullMoveResult.allowed) {
      cameraHolder.position.copy(fullMoveResult.pos);
      return true;
    }

    const slidePos = originalPos.clone();

    slidePos.x = attemptedPos.x;
    if (checkCollision(slidePos, false)) {
      slidePos.x = originalPos.x;
    }

    slidePos.z = attemptedPos.z;
    if (checkCollision(slidePos, false)) {
      slidePos.z = originalPos.z;
    }

    if (!slidePos.equals(originalPos)) {
      cameraHolder.position.copy(slidePos);
      return true;
    }

    return false;
  }

  const pressingForward = keyboard.pressed("W") || keyboard.pressed("up");
  const pressingLeft = keyboard.pressed("A") || keyboard.pressed("left");
  const pressingRight = keyboard.pressed("D") || keyboard.pressed("right");

  const diagonalLeft = pressingForward && pressingLeft;
  const diagonalRight = pressingForward && pressingRight;

  if (diagonalLeft) {
    const diagonalDir = direction.clone().add(side).normalize();
    tryMove(diagonalDir);
    return;
  }

  if (diagonalRight) {
    const diagonalDir = direction.clone().add(side.clone().negate()).normalize();
    tryMove(diagonalDir);
    return;
  }

  if (pressingForward) {
    tryMove(direction);
  }

  if (keyboard.pressed("S") || keyboard.pressed("down")) {
    tryMove(direction.clone().negate());
  }

  if (pressingLeft && !pressingForward) {
    tryMove(side);
  }

  if (pressingRight && !pressingForward) {
    tryMove(side.clone().negate());
  }
}

function applyGravity() {
  const groundCheckHeight = 0.1;
  const gravityStep = 0.15;
  const playerHeight = 2.0;
  const minY = 0.8;

  const downPos = cameraHolder.position.clone();
  downPos.y -= groundCheckHeight + playerHeight / 2;

  const playerBox = new THREE.Box3().setFromCenterAndSize(
    downPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),
    new THREE.Vector3(1.0, playerHeight, 1.0)
  );

  let grounded = false;
  for (const mesh of collidableMeshes) {
    const meshBox = new THREE.Box3().setFromObject(mesh);
    if (playerBox.intersectsBox(meshBox)) {
      grounded = true;
      break;
    }
  }

  if (!grounded) {
    cameraHolder.position.y -= gravityStep;
    if (cameraHolder.position.y < minY) {
      cameraHolder.position.y = minY;
    }
  }
}

function render() {
  requestAnimationFrame(render);
  keyboardUpdate();
  applyGravity();
  renderer.render(scene, camera);
}

export { scene, camera, cameraHolder, renderer, controls, keyboardUpdate, render };