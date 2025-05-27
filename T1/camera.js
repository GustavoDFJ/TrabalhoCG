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

// Inicializa o renderizador WebGL
let renderer = initRenderer();

// Inicializa o estado do teclado
let keyboard = new KeyboardState();

// Cria a câmera em perspectiva
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// Define posição inicial da câmera no espaço 3D
camera.position.set(0, 2.0, 0);
// Define o vetor "cima" da câmera (eixo Y)
camera.up.set(0.0, 1.0, 0.0);
// Aponta a câmera para um ponto específico na cena
camera.lookAt(new THREE.Vector3(0.0, 2.0, 0.0));

// Cria um objeto "holder" para movimentar a câmera inteira (facilita o controle)
let cameraHolder = new THREE.Object3D();
// Adiciona a câmera dentro do holder (pai)
cameraHolder.add(camera);
// Adiciona o holder na cena principal
scene.add(cameraHolder);

// Inicializa controles de movimento baseados em bloqueio do cursor (pointer lock)
const controls = new PointerLockControls(camera, renderer.domElement);

// Configura evento para ativar o bloqueio do cursor ao clicar no canvas
renderer.domElement.addEventListener('click', () => {
  controls.lock();
}, false);

// Ajusta o tamanho do renderizador e da câmera ao redimensionar a janela
window.addEventListener('resize', () => onWindowResize(camera, renderer), false);

/**
 * Função para checar colisão do jogador com obstáculos
 * 
 * @param nextPos - posição para a qual o jogador quer se mover
 * @param tryStep - se deve tentar "subir degraus"
 * @returns true se colidir, false se não colidir, ou um objeto {allowed, pos} se for possível subir degrau
 */
function checkCollision(nextPos, tryStep = true) {
  const playerHeight = 2.0;  // Altura do jogador
  const playerSize = new THREE.Vector3(1.0, playerHeight, 1.0);  // Tamanho do jogador (largura, altura, profundidade)

  // Cria a caixa delimitadora (bounding box) para o jogador na próxima posição
  const originalBox = new THREE.Box3().setFromCenterAndSize(
    nextPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),  // Centro da caixa (na altura do jogador)
    playerSize  // Tamanho da caixa
  );

  // Para cada objeto que pode colidir na cena
  for (const mesh of collidableMeshes) {
    // Cria a bounding box do objeto
    const meshBox = new THREE.Box3().setFromObject(mesh);
    // Verifica se a caixa do jogador colide com a do objeto
    if (originalBox.intersectsBox(meshBox)) {
      // Verifica se o objeto é uma escada
      const isStair = stairMeshes.includes(mesh);
      // Se não for escada ou não deve tentar subir degrau, retorna colisão
      if (!isStair || !tryStep) return true;

      // Caso seja escada, tenta subir degraus pequenos para verificar se pode subir
      const maxStepHeight = 1;  // Altura máxima do degrau
      const stepIncrement = 0.1; // Incremento para tentar subir aos poucos

      // Tenta cada altura incremental de degrau
      for (let step = stepIncrement; step <= maxStepHeight; step += stepIncrement) {
        // Cria posição simulando o jogador subindo o degrau
        const stepPos = nextPos.clone().add(new THREE.Vector3(0, step, 0));
        // Cria bounding box para essa nova posição
        const stepBox = new THREE.Box3().setFromCenterAndSize(
          stepPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),
          playerSize
        );

        let blocked = false;
        // Verifica se alguma colisão ocorre nessa nova posição
        for (const mesh of collidableMeshes) {
          const meshBox = new THREE.Box3().setFromObject(mesh);
          if (stepBox.intersectsBox(meshBox)) {
            blocked = true;  // Está bloqueado (colisão)
            break;
          }
        }

        // Se não bloqueado, permite subir o degrau e retorna resultado positivo
        if (!blocked) {
          nextPos.y += step;  // Atualiza posição Y para degrau
          return { allowed: true, pos: nextPos };
        }
      }
      // Se não conseguiu subir degrau, retorna colisão
      return true;
    }
  }
  // Sem colisão detectada
  return false;
}

/**
 * Atualiza o movimento baseado no teclado
 */
function keyboardUpdate() {
  keyboard.update();  // Atualiza estado do teclado
  const moveSpeed = 1;  // Velocidade do movimento

  // Obtém a direção para onde a câmera está apontando (movimento para frente)
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;  // Ignora a componente vertical para movimento plano
  direction.normalize();  // Normaliza o vetor

  // Calcula vetor lateral para movimento lateral (direita/esquerda)
  const side = new THREE.Vector3();
  side.crossVectors(camera.up, direction).normalize();

  // Função auxiliar para tentar mover o jogador respeitando colisões
  function tryMove(moveVec) {
    // Calcula a próxima posição do jogador
    const nextPos = cameraHolder.position.clone().addScaledVector(moveVec, moveSpeed);
    // Verifica colisões para essa nova posição
    const result = checkCollision(nextPos);
    if (result === false) {
      // Movimento permitido, atualiza posição
      cameraHolder.position.copy(nextPos);
      return true;
    } else if (result.allowed) {
      // Subiu degrau, atualiza posição para a nova
      cameraHolder.position.copy(result.pos);
      return true;
    }
    // Movimento bloqueado
    return false;
  }

  // Verifica quais teclas estão sendo pressionadas para direção
  const pressingForward = keyboard.pressed("W") || keyboard.pressed("up");
  const pressingLeft = keyboard.pressed("A") || keyboard.pressed("left");
  const pressingRight = keyboard.pressed("D") || keyboard.pressed("right");

  // Detecta movimentos diagonais (frente+esquerda ou frente+direita)
  const diagonalLeft = pressingForward && pressingLeft;
  const diagonalRight = pressingForward && pressingRight;

  // Movimento diagonal para frente-esquerda
  if (diagonalLeft) {
    const diagonalDir = direction.clone().add(side).normalize();
    if (!tryMove(diagonalDir)) {
      tryMove(side);  // Se não conseguir, tenta só o movimento lateral
    }
    return;  // Sai da função após mover
  }

  // Movimento diagonal para frente-direita
  if (diagonalRight) {
    const diagonalDir = direction.clone().add(side.clone().negate()).normalize();
    if (!tryMove(diagonalDir)) {
      tryMove(side.clone().negate());
    }
    return;
  }

  // Movimento para frente
  if (pressingForward) {
    if (!tryMove(direction)) {
      if (!tryMove(side)) {
        tryMove(side.clone().negate());  // Tenta alternativas caso bloqueado
      }
    }
  }

  // Movimento para trás
  if (keyboard.pressed("S") || keyboard.pressed("down")) {
    tryMove(direction.clone().negate());
  }

  // Movimento lateral esquerdo (sem andar para frente)
  if (pressingLeft && !pressingForward) {
    tryMove(side);
  }

  // Movimento lateral direito (sem andar para frente)
  if (pressingRight && !pressingForward) {
    tryMove(side.clone().negate());
  }
}

/**
 * Aplica gravidade ao jogador, fazendo com que ele caia quando não estiver sobre uma superfície
 */
function applyGravity() {
  const groundCheckHeight = 0.1;  // Distância abaixo para verificar chão
  const gravityStep = 0.15;        // Valor do passo da gravidade (quanto cai)
  const playerHeight = 2.0;        // Altura do jogador
  const minY = 0.8;               // Limite mínimo para não cair infinitamente

  // Calcula posição para verificar se está no chão (um pouco abaixo do jogador)
  const downPos = cameraHolder.position.clone();
  downPos.y -= groundCheckHeight + playerHeight / 2;

  // Cria bounding box para essa posição de verificação
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    downPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),
    new THREE.Vector3(1.0, playerHeight, 1.0)
  );

  let grounded = false;  // Flag para indicar se está no chão

  // Verifica colisão com objetos para saber se está no chão
  for (const mesh of collidableMeshes) {
    const meshBox = new THREE.Box3().setFromObject(mesh);
    if (playerBox.intersectsBox(meshBox)) {
      grounded = true;
      break;
    }
  }

  // Se não estiver no chão, aplica efeito da gravidade
  if (!grounded) {
    cameraHolder.position.y -= gravityStep;
    // Evita que o jogador caia abaixo do limite mínimo
    if (cameraHolder.position.y < minY) {
      cameraHolder.position.y = minY;
    }
  }
}

/**
 * Função principal de renderização e atualização
 */
function render() {
  requestAnimationFrame(render);  // Agenda nova chamada para o próximo frame
  keyboardUpdate();               // Atualiza movimento pelo teclado
  applyGravity();                 // Aplica gravidade ao jogador
  renderer.render(scene, camera); // Renderiza a cena com a câmera atual
}

// Exporta as principais variáveis e funções para uso em outros arquivos
export { scene, camera, cameraHolder, renderer, controls, keyboardUpdate, render };
