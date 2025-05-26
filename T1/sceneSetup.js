// Importação de módulos do Three.js
import * as THREE from 'three';
import { createGroundPlaneXZ } from "../libs/util/util.js";

// Criação da cena
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);  // Define cor de fundo escura

// Arrays para armazenar objetos com colisão e escadas
export const collidableMeshes = [];
export const stairMeshes = [];

// Função para adicionar propriedades de sombra a um mesh
function addShadowProps(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

// Configuração das luzes
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);  // Luz ambiente suave
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);  // Luz direcional
directionalLight.position.set(10, 20, 10);  // Posição da luz
directionalLight.castShadow = true;  // Habilita sombras
scene.add(directionalLight);

// Criação do chão
const floor = createGroundPlaneXZ(500, 500);  // Plano grande de 500x500
floor.receiveShadow = true;  // Recebe sombras
scene.add(floor);

// ===================== PAREDES =====================

// Geometria das paredes horizontais
let wallGeometry = new THREE.BoxGeometry(500, 10, 1);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });  // Cinza escuro

// Paredes superior e inferior
[
  [0, 5, 249.5],  // Parte superior
  [0, 5, -249.5]  // Parte inferior
].forEach(pos => {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(...pos);
  addShadowProps(wall);
  scene.add(wall);
  collidableMeshes.push(wall);  // Adiciona para colisões
});

// Geometria das paredes verticais
wallGeometry = new THREE.BoxGeometry(1, 10, 500);

// Paredes esquerda e direita
[
  [249.5, 5, 0],   // Direita
  [-249.5, 5, 0]   // Esquerda
].forEach(pos => {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(...pos);
  addShadowProps(wall);
  scene.add(wall);
  collidableMeshes.push(wall);
});

// ===================== FUNÇÃO PARA ESCADAS =====================

/**
 * Cria uma escada composta por vários degraus.
 * @param {Object} stepSize - Dimensões do degrau: {x, y, z}
 * @param {number} numSteps - Número de degraus
 * @param {number} angle - Rotação da escada
 * @param {THREE.Vector3} position - Posição da base da escada
 * @param {THREE.Material} material - Material da escada
 */
function staircase(stepSize, numSteps, angle, position, material) {
  const staircase = new THREE.Group();
  staircase.position.copy(position);
  staircase.rotation.y = angle;

  for (let i = 0; i < numSteps; i++) {
    const stepGeometry = new THREE.BoxGeometry(stepSize.x, stepSize.y, stepSize.z);
    const step = new THREE.Mesh(stepGeometry, material);
    // Posiciona cada degrau acumulando altura e profundidade
    step.position.set(0, (i + 0.5) * stepSize.y, (i + 0.5) * stepSize.z);
    step.castShadow = true;
    step.receiveShadow = true;
    staircase.add(step);
  }

  return staircase;
}

// ===================== ÁREAS DE CORES =====================

export function createSceneObjects() {
  // Materiais para cada área
  const matRed = new THREE.MeshStandardMaterial({ color: 0xff3333 });
  const matBlue = new THREE.MeshStandardMaterial({ color: 0x4682b4 });
  const matGreen = new THREE.MeshStandardMaterial({ color: 0x6b8e23 });
  const matYellow = new THREE.MeshStandardMaterial({ color: 0xffb90f });

  // ===================== ÁREA VERMELHA =====================
  const redBase = new THREE.Mesh(new THREE.BoxGeometry(120, 1.6, 116), matRed);
  redBase.position.set(-155, 0.8, -157);
  addShadowProps(redBase);
  scene.add(redBase);
  collidableMeshes.push(redBase);

  // Passagens vermelhas
  [[-112.5, -97.25, 35], [-177.5, -97.25, 75]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, 4.5), matRed);
    p.position.set(x, 0.8, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  // Escada vermelha
  const redStair = staircase({ x: 10, y: 0.2, z: 0.5 }, 8, Math.PI, new THREE.Vector3(-135, 0, -95), matRed);
  addShadowProps(redStair);
  scene.add(redStair);
  redStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA AZUL =====================
  const blueBase = new THREE.Mesh(new THREE.BoxGeometry(120, 1.6, 116), matBlue);
  blueBase.position.set(0, 0.8, -157);
  addShadowProps(blueBase);
  scene.add(blueBase);
  collidableMeshes.push(blueBase);

  // Passagens azuis
  [[42.5, -97.25, 35], [-22.5, -97.25, 75]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, 4.5), matBlue);
    p.position.set(x, 0.8, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  // Escada azul
  const blueStair = staircase({ x: 10, y: 0.2, z: 0.5 }, 8, Math.PI, new THREE.Vector3(20, 0, -95), matBlue);
  addShadowProps(blueStair);
  scene.add(blueStair);
  blueStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA VERDE =====================
  const greenBase = new THREE.Mesh(new THREE.BoxGeometry(120, 1.6, 116), matGreen);
  greenBase.position.set(155, 0.8, -157);
  addShadowProps(greenBase);
  scene.add(greenBase);
  collidableMeshes.push(greenBase);

  // Passagens verdes
  [[187.5, -97.25, 55], [122.5, -97.25, 55]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, 4.5), matGreen);
    p.position.set(x, 0.8, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  // Escada verde
  const greenStair = staircase({ x: 10, y: 0.2, z: 0.5 }, 8, Math.PI, new THREE.Vector3(155, 0, -95), matGreen);
  addShadowProps(greenStair);
  scene.add(greenStair);
  greenStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA AMARELA (CORRIGIDA) =====================
  const yellowBase = new THREE.Mesh(new THREE.BoxGeometry(180, 1.6, 116), matYellow);  // Base maior: 180x116
  yellowBase.position.set(0, 0.8, 157);
  addShadowProps(yellowBase);
  scene.add(yellowBase);
  collidableMeshes.push(yellowBase);

  // Passagens amarelas
  [[-100, 97.25, 150], [100, 97.25, 150]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, 4.5), matYellow);
    p.position.set(x, 0.8, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  // Escada amarela
  const yellowStair = staircase({ x: 10, y: 0.2, z: 0.5 }, 8, 0, new THREE.Vector3(0, 0, 95), matYellow);
  addShadowProps(yellowStair);
  scene.add(yellowStair);
  yellowStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });
}
