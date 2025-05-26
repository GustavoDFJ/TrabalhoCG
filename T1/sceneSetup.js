import * as THREE from 'three';
// Importa tudo da biblioteca three.js no objeto THREE para manipulação 3D.

import { createGroundPlaneXZ } from "../libs/util/util.js";
// Importa função utilitária para criar um plano no eixo XZ (chão).

// Cena e arrays de colisão
export const scene = new THREE.Scene();
// Cria a cena 3D principal onde todos os objetos serão adicionados.

scene.background = new THREE.Color(0x111111);
// Define a cor de fundo da cena (cinza muito escuro).

export const collidableMeshes = []; // Objetos sólidos
// Array para armazenar objetos com os quais o jogador pode colidir (paredes, chão, etc).

export const stairMeshes = [];      // Apenas escadas (podem ser escaladas)
// Array específico para armazenar os objetos que são escadas, para tratar subida.

function addShadowProps(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}
// Função para habilitar sombras em um objeto: ele projeta e recebe sombras.

// Luzes
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
// Luz ambiente que ilumina tudo uniformemente com intensidade 0.8 (80%).

scene.add(ambientLight);
// Adiciona a luz ambiente na cena.

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
// Luz direcional que simula a luz do sol, com intensidade 0.5.

directionalLight.position.set(10, 20, 10);
// Posiciona a luz direcional em um ponto alto e lateral (para criar sombras).

directionalLight.castShadow = true;
// Permite que essa luz crie sombras.

scene.add(directionalLight);
// Adiciona a luz direcional na cena.

// Chão
const floor = createGroundPlaneXZ(500, 500);
// Cria um plano de 500x500 unidades para o chão, usando função utilitária.

floor.receiveShadow = true;
// Permite que o chão receba sombras dos objetos acima.

scene.add(floor);
// Adiciona o chão na cena.

// Paredes externas
let wallGeometry = new THREE.BoxGeometry(500, 10, 1);
// Geometria retangular para as paredes frontais e traseiras (largura 500, altura 10, profundidade 1).

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
// Material padrão cinza para as paredes, reage à luz.

const wallPositions = [
  [0, 5, 249.5],
  [0, 5, -249.5]
];
// Posições centrais das paredes frontais e traseiras (em Y está no meio da altura).

wallPositions.forEach(pos => {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  // Cria a parede com a geometria e material definidos.

  wall.position.set(...pos);
  // Posiciona a parede no local indicado.

  addShadowProps(wall);
  // Habilita sombras para essa parede.

  scene.add(wall);
  // Adiciona a parede na cena.

  collidableMeshes.push(wall);
  // Adiciona essa parede na lista de objetos sólidos para colisão.
});

wallGeometry = new THREE.BoxGeometry(1, 10, 500);
// Geometria para as paredes laterais (espessura 1, altura 10, comprimento 500).

const sideWallPositions = [
  [249.5, 5, 0],
  [-249.5, 5, 0]
];
// Posições das paredes laterais direita e esquerda.

sideWallPositions.forEach(pos => {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  // Cria a parede lateral.

  wall.position.set(...pos);
  // Posiciona a parede lateral.

  addShadowProps(wall);
  // Habilita sombras para essa parede.

  scene.add(wall);
  // Adiciona na cena.

  collidableMeshes.push(wall);
  // Adiciona para detecção de colisão.
});

// Criação da escada
function staircase(stepSize, numSteps, angle, position, material) {
  const staircase = new THREE.Group();
  // Cria um grupo para agregar todos os degraus da escada.

  staircase.position.copy(position);
  // Posiciona o grupo da escada na posição passada.

  staircase.rotation.y = angle;
  // Rotaciona a escada no eixo Y para o ângulo desejado.

  for (let i = 0; i < numSteps; i++) {
    const stepGeometry = new THREE.BoxGeometry(stepSize.x, stepSize.y, stepSize.z);
    // Cria a geometria de um degrau.

    const step = new THREE.Mesh(stepGeometry, material);
    // Cria o mesh do degrau com o material passado.

    step.position.set(0, (i + 0.5) * stepSize.y, (i + 0.5) * stepSize.z);
    // Posiciona o degrau em Y e Z empilhados e alinhados para formar a escada.

    step.castShadow = true;
    step.receiveShadow = true;
    // Habilita sombras para o degrau.

    staircase.add(step);
    // Adiciona o degrau ao grupo da escada.
  }

  return staircase;
  // Retorna o grupo da escada completo.
}

// Criação das áreas
export function createSceneObjects() {
  const areas = [
    {
      color: 0xff3333,
      center: [-155, 0.8, -157],
      passagens: [[-112.5, -97.25, 35], [-177.5, -97.25, 75]],
      escada: [-135, 0, -95, Math.PI]
    },
    {
      color: 0x4682b4,
      center: [0, 0.8, -157],
      passagens: [[42.5, -97.25, 35], [-22.5, -97.25, 75]],
      escada: [20, 0, -95, Math.PI]
    },
    {
      color: 0x6b8e23,
      center: [155, 0.8, -157],
      passagens: [[187.5, -97.25, 55], [122.5, -97.25, 55]],
      escada: [155, 0, -95, Math.PI]
    },
    {
      color: 0xffb90f,
      center: [0, 0.8, 157],
      passagens: [[-80, 97.25, 150], [80, 97.25, 150]],
      escada: [0, 0, 95, 0]
    }
  ];
  // Define um array de áreas, cada uma com cor, posição central, passagens e escada.

  areas.forEach(area => {
    const areaMaterial = new THREE.MeshStandardMaterial({ color: area.color });
    // Cria material para a área com a cor definida.

    const base = new THREE.Mesh(new THREE.BoxGeometry(120, 1.6, 116), areaMaterial);
    // Cria a base da área como um paralelepípedo baixo.

    base.position.set(...area.center);
    // Posiciona a base na coordenada central da área.

    addShadowProps(base);
    // Habilita sombras para a base.

    scene.add(base);
    // Adiciona a base na cena.

    collidableMeshes.push(base);
    // Adiciona a base para colisão.

    area.passagens.forEach(([x, z, w]) => {
      const passage = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, 4.5), areaMaterial);
      // Cria um mesh para uma passagem (abertura ou corredor) com largura `w`.

      passage.position.set(x, 0.8, z);
      // Posiciona a passagem na coordenada X,Z, com altura no meio da base.

      addShadowProps(passage);
      // Habilita sombras para a passagem.

      scene.add(passage);
      // Adiciona a passagem na cena.

      collidableMeshes.push(passage);
      // Adiciona a passagem na lista de colisores.
    });

    const stair = staircase(
      { x: 10, y: 0.2, z: 0.5 }, // Tamanho do degrau
      8,                         // Número de degraus
      area.escada[3],            // Ângulo da escada (rot Y)
      new THREE.Vector3(...area.escada.slice(0, 3)), // Posição da escada
      areaMaterial               // Material
    );
    // Cria a escada da área com as propriedades definidas.

    addShadowProps(stair);
    // Habilita sombras para o grupo da escada.

    scene.add(stair);
    // Adiciona a escada na cena.

    // Correção: adicionar degraus individualmente
    stair.children.forEach(step => {
      collidableMeshes.push(step);
      stairMeshes.push(step);
      // Adiciona cada degrau à lista de colisores e também à lista de escadas.
    });
  });
}
