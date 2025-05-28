// Importação dos módulos do Three.js e funções utilitárias (setDefaultMaterial e initDefaultBasicLight)
import * as THREE from 'three';
import { createGroundPlaneXZ, setDefaultMaterial, initDefaultBasicLight } from "../libs/util/util.js";

// Criação da cena
export const scene = new THREE.Scene();
// Define a cor de fundo da cena para um tom escuro
scene.background = new THREE.Color(0x111111);

// Arrays para armazenar os objetos que possuem colisão e as escadas
export const collidableMeshes = [];  // Objetos que podem colidir
export const stairMeshes = [];       // Degraus das escadas

// Função para adicionar propriedades de sombra a um objeto mesh
function addShadowProps(mesh) {
  mesh.castShadow = true;     // O objeto projeta sombra
  mesh.receiveShadow = true;  // O objeto recebe sombra
}

// Inicializa a iluminação padrão básica da cena, conforme pedido pelo professor
initDefaultBasicLight(scene);

// Criação do plano do chão com 500x500 unidades
const floor = createGroundPlaneXZ(500, 500);
// O chão recebe sombra (não projeta)
floor.receiveShadow = true;
// Adiciona o chão à cena
scene.add(floor);

// ===================== PAREDES =====================

// Geometria base para paredes horizontais: largura 500, altura 10, profundidade 1
let wallGeometry = new THREE.BoxGeometry(500, 10, 1);
// Material padrão para as paredes, usando setDefaultMaterial com cor cinza escuro
const wallMaterial = setDefaultMaterial(0x555555);

// Cria as paredes superior e inferior da sala
[
  [0, 5, 249.5],   // Posição da parede superior (x, y, z)
  [0, 5, -249.5]   // Posição da parede inferior
].forEach(pos => {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial); // Cria mesh da parede
  wall.position.set(...pos);                               // Define a posição da parede
  addShadowProps(wall);                                    // Adiciona propriedades de sombra
  scene.add(wall);                                         // Adiciona a parede à cena
  collidableMeshes.push(wall);                             // Adiciona ao array de colisão
});

// Geometria para paredes verticais (paredes laterais): largura 1, altura 10, profundidade 500
wallGeometry = new THREE.BoxGeometry(1, 10, 500);

// Cria as paredes esquerda e direita
[
  [249.5, 5, 0],    // Posição da parede direita
  [-249.5, 5, 0]    // Posição da parede esquerda
].forEach(pos => {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial); // Cria mesh da parede lateral
  wall.position.set(...pos);                               // Define posição
  addShadowProps(wall);                                    // Propriedades de sombra
  scene.add(wall);                                         // Adiciona à cena
  collidableMeshes.push(wall);                             // Adiciona para colisão
});

// ===================== FUNÇÃO PARA ESCADAS =====================

// Função que cria uma escada com passos em forma de caixas
// stepSize: vetor com dimensões de cada degrau
// numSteps: número de degraus
// angle: rotação da escada em torno do eixo Y (vertical)
// position: posição inicial da escada (THREE.Vector3)
// material: material dos degraus (usando setDefaultMaterial)
function staircase(stepSize, numSteps, angle, position, material) {
  const staircase = new THREE.Group();           // Cria grupo para juntar os degraus
  staircase.position.copy(position);              // Posiciona o grupo na cena
  staircase.rotation.y = angle;                    // Rotaciona o grupo da escada

  // Cria cada degrau como uma caixa e posiciona sequencialmente
  for (let i = 0; i < numSteps; i++) {
    const stepGeometry = new THREE.BoxGeometry(stepSize.x, stepSize.y, stepSize.z);  // Geometria do degrau
    const step = new THREE.Mesh(stepGeometry, material);                             // Cria o degrau
    // Posiciona degrau no eixo Y (altura) e Z (profundidade) incremental para formar escada
    step.position.set(0, (i + 0.5) * stepSize.y, (i + 0.5) * stepSize.z);
    step.castShadow = true;     // Degrau projeta sombra
    step.receiveShadow = true;  // Degrau recebe sombra
    staircase.add(step);        // Adiciona degrau ao grupo escada
  }

  return staircase;  // Retorna o grupo de escada com os degraus
}

// ===================== ÁREAS DE CORES =====================

// Função que cria as áreas coloridas da cena (vermelha, azul, verde, amarela)
export function createSceneObjects() {
  // Materiais para cada área usando a função setDefaultMaterial e cores específicas
  const matRed = setDefaultMaterial(0xff3333);
  const matBlue = setDefaultMaterial(0x4682b4);
  const matGreen = setDefaultMaterial(0x6b8e23);
  const matYellow = setDefaultMaterial(0xffb90f);

  // Define altura padrão para as áreas e calcula a posição vertical central
  const areaHeight = 4;
  const areaY = areaHeight / 2;

  // ===================== ÁREA VERMELHA =====================
  // Criação da base vermelha como caixa grande
  const redBase = new THREE.Mesh(new THREE.BoxGeometry(120, areaHeight, 116), matRed);
  redBase.position.set(-155, areaY, -157);  // Posiciona a base
  addShadowProps(redBase);
  scene.add(redBase);
  collidableMeshes.push(redBase);

  // Criação de paredes vermelhas menores
  [[-112.5, -97.25, 35], [-177.5, -97.25, 75]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, areaHeight, 4.5), matRed);
    p.position.set(x, areaY, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  // Criação da escada vermelha com 8 degraus
  const redStair = staircase({ x: 10, y: 0.5, z: 0.5 }, 8, Math.PI, new THREE.Vector3(-135, 0, -95), matRed);
  addShadowProps(redStair);
  scene.add(redStair);
  // Adiciona cada degrau da escada ao array de colisão e escadas
  redStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA AZUL =====================
  const blueBase = new THREE.Mesh(new THREE.BoxGeometry(120, areaHeight, 116), matBlue);
  blueBase.position.set(0, areaY, -157);
  addShadowProps(blueBase);
  scene.add(blueBase);
  collidableMeshes.push(blueBase);

  [[42.5, -97.25, 35], [-22.5, -97.25, 75]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, areaHeight, 4.5), matBlue);
    p.position.set(x, areaY, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  const blueStair = staircase({ x: 10, y: 0.5, z: 0.5 }, 8, Math.PI, new THREE.Vector3(20, 0, -95), matBlue);
  addShadowProps(blueStair);
  scene.add(blueStair);
  blueStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA VERDE =====================
  const greenBase = new THREE.Mesh(new THREE.BoxGeometry(120, areaHeight, 116), matGreen);
  greenBase.position.set(155, areaY, -157);
  addShadowProps(greenBase);
  scene.add(greenBase);
  collidableMeshes.push(greenBase);

  [[187.5, -97.25, 55], [122.5, -97.25, 55]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, areaHeight, 4.5), matGreen);
    p.position.set(x, areaY, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  const greenStair = staircase({ x: 10, y: 0.5, z: 0.5 }, 8, Math.PI, new THREE.Vector3(155, 0, -95), matGreen);
  addShadowProps(greenStair);
  scene.add(greenStair);
  greenStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });

  // ===================== ÁREA AMARELA =====================
  const yellowBase = new THREE.Mesh(new THREE.BoxGeometry(200, areaHeight, 116), matYellow);
  yellowBase.position.set(0, areaY, 157);
  addShadowProps(yellowBase);
  scene.add(yellowBase);
  collidableMeshes.push(yellowBase);

  [[-52, 97.25, 96], [52, 97.25, 96]].forEach(([x, z, w]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, areaHeight, 4.5), matYellow);
    p.position.set(x, areaY, z);
    addShadowProps(p);
    scene.add(p);
    collidableMeshes.push(p);
  });

  const yellowStair = staircase({ x: 10, y: 0.5, z: 0.5 }, 8, 0, new THREE.Vector3(0, 0, 95), matYellow);
  addShadowProps(yellowStair);
  scene.add(yellowStair);
  yellowStair.children.forEach(step => {
    collidableMeshes.push(step);
    stairMeshes.push(step);
  });
}
