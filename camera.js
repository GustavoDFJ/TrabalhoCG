// Importa a biblioteca Three.js, essencial para gráficos 3D na web.
import * as THREE from 'three';

// Importa objetos e arrays necessários da configuração inicial da cena.
import { scene, collidableMeshes, stairMeshes } from './sceneSetup.js';

// Importa a classe para manipular o estado do teclado.
import KeyboardState from '../libs/util/KeyboardState.js';

// Importa os controles personalizados baseados em PointerLock, usados para navegação em primeira pessoa.
import { PointerLockControls } from './PointerLockControls_Trabalho.js';

// Importa funções utilitárias: inicialização do renderizador e ajuste ao redimensionar a janela.
import {
  initRenderer,
  onWindowResize
} from "../libs/util/util.js";

// Inicializa o renderizador WebGL.
let renderer = initRenderer();

// Cria a instância do gerenciador de estado do teclado.
let keyboard = new KeyboardState();

// Cria a câmera perspectiva com campo de visão de 45°, aspecto baseado no tamanho da janela, plano de recorte próximo e distante.
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

// Define a posição inicial da câmera no espaço 3D.
camera.position.set(0, 2.0, 0);

// Define o vetor "para cima" da câmera, indicando qual direção é considerada como "cima".
camera.up.set(0.0, 1.0, 0.0);

// Faz a câmera olhar para um ponto específico no espaço (acima de sua posição atual).
camera.lookAt(new THREE.Vector3(0.0, 2.0, 0.0));

// Cria um objeto vazio para agrupar a câmera, facilitando movimentações.
let cameraHolder = new THREE.Object3D();

// Adiciona a câmera como filho do "cameraHolder".
cameraHolder.add(camera);

// Adiciona o "cameraHolder" à cena para que ele seja renderizado e possa interagir com o ambiente.
scene.add(cameraHolder);

// Cria os controles de movimentação baseados em PointerLock, permitindo navegação com mouse.
const controls = new PointerLockControls(camera, renderer.domElement);

// Adiciona um evento que ativa o bloqueio do mouse quando o usuário clica no canvas.
renderer.domElement.addEventListener('click', () => controls.lock(), false);

// Adiciona evento para ajustar o tamanho da renderização caso a janela seja redimensionada.
window.addEventListener('resize', () => onWindowResize(camera, renderer), false);

// Função para verificar colisão entre o jogador e objetos colidíveis.
function checkCollision(nextPos, tryStep = true) {
  const playerHeight = 2.0; // Altura do jogador.
  const playerSize = new THREE.Vector3(1.0, playerHeight, 1.0); // Dimensões da "caixa" do jogador.

  // Cria uma caixa delimitadora (AABB) ao redor da posição proposta do jogador.
  const originalBox = new THREE.Box3().setFromCenterAndSize(
    nextPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),
    playerSize
  );

  // Itera sobre todos os objetos colidíveis.
  for (const mesh of collidableMeshes) {
    // Cria a caixa delimitadora do objeto atual.
    const meshBox = new THREE.Box3().setFromObject(mesh);

    // Verifica se há interseção entre a caixa do jogador e a do objeto.
    if (originalBox.intersectsBox(meshBox)) {
      // Verifica se o objeto colidido é uma escada.
      const isStair = stairMeshes.includes(mesh);

      // Se não for uma escada ou não for permitido tentar subir, retorna colisão.
      if (!isStair || !tryStep) return true;

      const maxStepHeight = 1; // Altura máxima que pode ser "escalada".
      const stepIncrement = 0.1; // Incremento para tentativa de subida.

      // Tenta subir pequenos degraus até a altura máxima permitida.
      for (let step = stepIncrement; step <= maxStepHeight; step += stepIncrement) {
        const stepPos = nextPos.clone().add(new THREE.Vector3(0, step, 0));

        // Cria nova caixa delimitadora para a posição elevada.
        const stepBox = new THREE.Box3().setFromCenterAndSize(
          stepPos.clone().add(new THREE.Vector3(0, playerHeight / 2 - 0.15, 0)),
          playerSize
        );

        let blocked = false;

        // Verifica se ao subir o degrau há nova colisão.
        for (const m of collidableMeshes) {
          const mBox = new THREE.Box3().setFromObject(m);
          if (stepBox.intersectsBox(mBox)) {
            blocked = true; // Colisão detectada, não pode subir.
            break;
          }
        }

        // Se não houve colisão ao subir, permite o movimento com pequeno impulso.
        if (!blocked) {
          stepPos.y += 0.05; // Impulso vertical extra.
          return { allowed: true, pos: stepPos };
        }
      }

      // Caso não consiga subir degrau, retorna colisão.
      return true;
    }
  }

  // Se não colidiu com nada, retorno falso (movimento permitido).
  return false;
}

// Função que atualiza a movimentação baseada nas teclas pressionadas.
function keyboardUpdate() {
  keyboard.update(); // Atualiza o estado do teclado.
  const moveSpeed = 0.7; // Velocidade de movimentação.

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction); // Obtém direção atual da câmera.
  direction.y = 0; // Ignora componente vertical.
  direction.normalize(); // Normaliza vetor.

  const side = new THREE.Vector3();
  side.crossVectors(camera.up, direction).normalize(); // Obtém vetor lateral (perpendicular).

  // Função auxiliar para tentar mover o jogador.
  function tryMove(moveVec) {
    const originalPos = cameraHolder.position.clone();
    const attemptedPos = originalPos.clone().addScaledVector(moveVec, moveSpeed);

    const fullMoveResult = checkCollision(attemptedPos, true);

    // Se não há colisão, move normalmente.
    if (fullMoveResult === false) {
      cameraHolder.position.copy(attemptedPos);
      return true;
    } 
    // Se for permitido subir degrau, ajusta posição.
    else if (fullMoveResult.allowed) {
      cameraHolder.position.copy(fullMoveResult.pos);
      return true;
    }

    // Caso haja colisão, tenta deslizar parcialmente em X.
    const slideX = new THREE.Vector3(moveVec.x, 0, 0).normalize();
    const slideZ = new THREE.Vector3(0, 0, moveVec.z).normalize();

    const trySlideX = originalPos.clone().addScaledVector(slideX, moveSpeed);
    if (!checkCollision(trySlideX, false)) {
      cameraHolder.position.copy(trySlideX);
      return true;
    }

    // Caso deslize X bloqueado, tenta deslizar em Z.
    const trySlideZ = originalPos.clone().addScaledVector(slideZ, moveSpeed);
    if (!checkCollision(trySlideZ, false)) {
      cameraHolder.position.copy(trySlideZ);
      return true;
    }

    // Não conseguiu se mover.
    return false;
  }

  // Checa teclas pressionadas.
  const pressingForward = keyboard.pressed("W") || keyboard.pressed("up");
  const pressingBack = keyboard.pressed("S") || keyboard.pressed("down");
  const pressingLeft = keyboard.pressed("A") || keyboard.pressed("left");
  const pressingRight = keyboard.pressed("D") || keyboard.pressed("right");

  const diagonalLeft = pressingForward && pressingLeft;
  const diagonalRight = pressingForward && pressingRight;

  // Movimentos diagonais com prioridade.
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

  // Movimentos cardinais.
  if (pressingForward) {
    tryMove(direction);
  }

  if (pressingBack) {
    tryMove(direction.clone().negate());
  }

  if (pressingLeft && !pressingForward) {
    tryMove(side);
  }

  if (pressingRight && !pressingForward) {
    tryMove(side.clone().negate());
  }
}

// Função que aplica gravidade ao jogador.
function applyGravity() {
  const groundCheckHeight = 0.1; // Distância para checar o chão.
  const gravityStep = 0.15; // Quanto o jogador cai por frame.
  const playerHeight = 2.0; 
  const minY = 0.8; // Altura mínima para impedir queda infinita.

  // Posição logo abaixo do jogador.
  const downPos = cameraHolder.position.clone();
  downPos.y -= groundCheckHeight + playerHeight / 2;

  // Cria caixa para verificar colisão com o chão.
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    downPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),
    new THREE.Vector3(1.0, playerHeight, 1.0)
  );

  let grounded = false;

  // Checa colisão com objetos colidíveis.
  for (const mesh of collidableMeshes) {
    const meshBox = new THREE.Box3().setFromObject(mesh);
    if (playerBox.intersectsBox(meshBox)) {
      grounded = true; // Está no chão.
      break;
    }
  }

  // Se não está no chão, aplica gravidade.
  if (!grounded) {
    cameraHolder.position.y -= gravityStep;
    if (cameraHolder.position.y < minY) {
      cameraHolder.position.y = minY; // Impede de cair abaixo do mínimo.
    }
  }
}

// Função principal de renderização.
function render() {
  requestAnimationFrame(render); // Loop de animação.
  keyboardUpdate(); // Atualiza movimentação.
  applyGravity(); // Aplica gravidade.
  renderer.render(scene, camera); // Renderiza a cena com a câmera.
}

// Exporta variáveis e funções para uso em outros arquivos.
export { scene, camera, cameraHolder, renderer, controls, keyboardUpdate, render };
