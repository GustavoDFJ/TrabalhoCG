// Importação de módulos do Three.js
import * as THREE from 'three';
import { createGroundPlaneXZ } from "../libs/util/util.js";

// Criação da cena
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);  // Define cor de fundo escura

// Arrays para armazenar objetos com colisão e escadas
export const collidableMeshes = [];  // Objetos que podem colidir
export const stairMeshes = [];  // Degraus de escadas

// Função para adicionar propriedades de sombra a um mesh
function addShadowProps(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

// Configuração das luzes
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);  // Luz ambiente
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);  // Luz direcional
directionalLight.position.set(10, 20, 10);  // Posição da luz
directionalLight.castShadow = true;  // A luz pode projetar sombras
scene.add(directionalLight);

// Criação do chão
const floor = createGroundPlaneXZ(500, 500);  // Cria o plano do chão
floor.receiveShadow = true;  // O chão recebe sombra
scene.add(floor);

// ===================== PAREDES =====================

let wallGeometry = new THREE.BoxGeometry(500, 10, 1);  // Geometria padrão para paredes horizontais
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });  // Material das paredes

// Paredes superior e inferior
[
  [0, 5, 249.5],
  [0, 5, -249.5]
].forEach(pos => {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);  // Criação da parede
  wall.position.set(...pos);  // Definição da posição
  addShadowProps(wall);  // Adiciona propriedades de sombra
  scene.add(wall);  // Adiciona à cena
  collidableMeshes.push(wall);  // Adiciona ao array de colisão
});

// Paredes esquerda e direita
wallGeometry = new THREE.BoxGeometry(1, 10, 500);  // Geometria para paredes verticais

[
  [249.5, 5, 0],
  [-249.5, 5, 0]
].forEach(pos => {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);  // Criação da parede
  wall.position.set(...pos);  // Definição da posição
  addShadowProps(wall);  // Adiciona propriedades de sombra
  scene.add(wall);  // Adiciona à cena
  collidableMeshes.push(wall);  // Adiciona ao array de colisão
});

// ===================== FUNÇÃO PARA ESCADAS =====================

function staircase(stepSize, numSteps, angle, position, material) {
  const staircase = new THREE.Group();  // Grupo para os degraus
  staircase.position.copy(position);  // Define a posição do grupo
  staircase.rotation.y = angle;  // Define a rotação do grupo

  for (let i = 0; i < numSteps; i++) {
    const stepGeometry = new THREE.BoxGeometry(stepSize.x, stepSize.y, stepSize.z);  // Geometria do degrau
    const step = new THREE.Mesh(stepGeometry, material);  // Criação do degrau
    step.position.set(0, (i + 0.5) * stepSize.y, (i + 0.5) * stepSize.z);  // Posição relativa do degrau
    step.castShadow = true;  // O degrau projeta sombra
    step.receiveShadow = true;  // O degrau recebe sombra
    staircase.add(step);  // Adiciona o degrau ao grupo
  }

  return staircase;  // Retorna o grupo de escadas
}

// ===================== ÁREAS DE CORES =====================

export function createSceneObjects() {
  const matRed = new THREE.MeshStandardMaterial({ color: 0xff3333 });  // Material vermelho
  const matBlue = new THREE.MeshStandardMaterial({ color: 0x4682b4 });  // Material azul
  const matGreen = new THREE.MeshStandardMaterial({ color: 0x6b8e23 });  // Material verde
  const matYellow = new THREE.MeshStandardMaterial({ color: 0xffb90f });  // Material amarelo

  const areaHeight = 4;  // Altura padrão das áreas
  const areaY = areaHeight / 2;  // Posição vertical padrão

  // ===================== ÁREA VERMELHA =====================
  const redBase = new THREE.Mesh(new THREE.BoxGeometry(120, areaHeight, 116), matRed);  // Base vermelha
  redBase.position.set(-155, areaY, -157);  // Posição da base
  addShadowProps(redBase);
  scene.add(redBase);
  collidableMeshes.push(redBase);

  [[-112.5, -97.25, 35], [-177.5, -97.25, 75]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, areaHeight, 4.5), matRed);  // Criação de parede vermelha
    p.position.set(x, areaY, z);  // Define a posição
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  const redStair = staircase({ x: 10, y: 0.5, z: 0.5 }, 8, Math.PI, new THREE.Vector3(-135, 0, -95), matRed);  // Escada vermelha
  addShadowProps(redStair);
  scene.add(redStair);
  redStair.children.forEach(step => {  // Cada degrau
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA AZUL =====================
  const blueBase = new THREE.Mesh(new THREE.BoxGeometry(120, areaHeight, 116), matBlue);  // Base azul
  blueBase.position.set(0, areaY, -157);
  addShadowProps(blueBase);
  scene.add(blueBase);
  collidableMeshes.push(blueBase);

  [[42.5, -97.25, 35], [-22.5, -97.25, 75]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, areaHeight, 4.5), matBlue);  // Criação de parede azul
    p.position.set(x, areaY, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  const blueStair = staircase({ x: 10, y: 0.5, z: 0.5 }, 8, Math.PI, new THREE.Vector3(20, 0, -95), matBlue);  // Escada azul
  addShadowProps(blueStair);
  scene.add(blueStair);
  blueStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA VERDE =====================
  const greenBase = new THREE.Mesh(new THREE.BoxGeometry(120, areaHeight, 116), matGreen);  // Base verde
  greenBase.position.set(155, areaY, -157);
  addShadowProps(greenBase);
  scene.add(greenBase);
  collidableMeshes.push(greenBase);

  [[187.5, -97.25, 55], [122.5, -97.25, 55]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, areaHeight, 4.5), matGreen);  // Criação de parede verde
    p.position.set(x, areaY, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  const greenStair = staircase({ x: 10, y: 0.5, z: 0.5 }, 8, Math.PI, new THREE.Vector3(155, 0, -95), matGreen);  // Escada verde
  addShadowProps(greenStair);
  scene.add(greenStair);
  greenStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA AMARELA =====================
  const yellowBase = new THREE.Mesh(new THREE.BoxGeometry(200, areaHeight, 116), matYellow);  // Base amarela
  yellowBase.position.set(0, areaY, 157);
  addShadowProps(yellowBase);
  scene.add(yellowBase);
  collidableMeshes.push(yellowBase);

  [[-52, 97.25, 96], [52, 97.25, 96]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, areaHeight, 4.5), matYellow);  // Criação de parede amarela
    p.position.set(x, areaY, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  const yellowStair = staircase({ x: 10, y: 0.5, z: 0.5 }, 8, 0, new THREE.Vector3(0, 0, 95), matYellow);  // Escada amarela
  addShadowProps(yellowStair);
  scene.add(yellowStair);
  yellowStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });
}
