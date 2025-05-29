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

// Cria a câmera perspectiva com FOV de 45°, aspecto da janela, e limites de renderização próximos/distantes.
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

// Define a posição inicial da câmera no espaço 3D.
camera.position.set(0, 2.0, 0);

// Define o vetor "para cima" da câmera, padrão (eixo Y positivo).
camera.up.set(0.0, 1.0, 0.0);

// Faz a câmera olhar para um ponto específico (em frente, na mesma altura).
camera.lookAt(new THREE.Vector3(0.0, 2.0, 0.0));

// Cria um objeto vazio para agrupar a câmera, útil para movimentações.
let cameraHolder = new THREE.Object3D();

// Adiciona a câmera como filho do "cameraHolder".
cameraHolder.add(camera);

// Adiciona o "cameraHolder" à cena.
scene.add(cameraHolder);

// Cria os controles baseados em PointerLock, permitindo navegação com mouse.
const controls = new PointerLockControls(camera, renderer.domElement);

// Adiciona evento para ativar o PointerLock ao clicar no canvas.
renderer.domElement.addEventListener('click', () => controls.lock(), false);

// Ajusta a renderização ao redimensionar a janela.
window.addEventListener('resize', () => onWindowResize(camera, renderer), false);

// Função para verificar colisão entre jogador e objetos colidíveis.
function checkCollision(nextPos, tryStep = true) {
  const playerHeight = 2.0; // Altura do jogador.
  const playerSize = new THREE.Vector3(1.0, playerHeight, 1.0); // Dimensões da "caixa" do jogador.

  // Cria caixa delimitadora ao redor da posição proposta.
  const originalBox = new THREE.Box3().setFromCenterAndSize(
    nextPos.clone().add(new THREE.Vector3(0, playerHeight / 2, 0)),
    playerSize
  );

  // Itera sobre todos os objetos colidíveis.
  for (const mesh of collidableMeshes) {
    // Cria a caixa delimitadora do objeto.
    const meshBox = new THREE.Box3().setFromObject(mesh);

    // Verifica interseção com o objeto.
    if (originalBox.intersectsBox(meshBox)) {
      // Verifica se o objeto é uma escada.
      const isStair = stairMeshes.includes(mesh);

      // Se não for escada ou não pode tentar subir, retorna colisão.
      if (!isStair || !tryStep) return true;

      const maxStepHeight = 1; // Altura máxima que pode subir.
      const stepIncrement = 0.1; // Incremento para tentativa de subida.

      // Tenta subir pequenos degraus até o máximo.
      for (let step = stepIncrement; step <= maxStepHeight; step += stepIncrement) {
        const stepPos = nextPos.clone().add(new THREE.Vector3(0, step, 0));

        // Cria nova caixa delimitadora para a posição elevada.
        const stepBox = new THREE.Box3().setFromCenterAndSize(
          stepPos.clone().add(new THREE.Vector3(0, playerHeight / 2 - 0.15, 0)),
          playerSize
        );

        let blocked = false;

        // Verifica se há colisão ao subir o degrau.
        for (const m of collidableMeshes) {
          const mBox = new THREE.Box3().setFromObject(m);
          if (stepBox.intersectsBox(mBox)) {
            blocked = true; // Não pode subir.
            break;
          }
        }

        // Se não houve colisão ao subir, permite movimento.
        if (!blocked) {
          stepPos.y += 0.05; // Pequeno impulso vertical extra.
          return { allowed: true, pos: stepPos };
        }
      }

      // Não conseguiu subir degrau, retorna colisão.
      return true;
    }
  }

  // Se não colidiu com nada, permite movimento.
  return false;
}

// Função que atualiza movimentação conforme teclas pressionadas.
function keyboardUpdate() {
  keyboard.update(); // Atualiza estado do teclado.
  const moveSpeed = 0.7; // Velocidade de movimento.

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction); // Direção atual da câmera.
  direction.y = 0; // Ignora vertical.
  direction.normalize(); // Normaliza vetor.

  const side = new THREE.Vector3();
  side.crossVectors(camera.up, direction).normalize(); // Vetor lateral (perpendicular).

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

    // Caso colisão, tenta deslizar em X.
    const slideX = new THREE.Vector3(moveVec.x, 0, 0).normalize();
    const slideZ = new THREE.Vector3(0, 0, moveVec.z).normalize();

    const trySlideX = originalPos.clone().addScaledVector(slideX, moveSpeed);
    if (!checkCollision(trySlideX, false)) {
      cameraHolder.position.copy(trySlideX);
      return true;
    }

    // Caso deslize X bloqueado, tenta em Z.
    const trySlideZ = originalPos.clone().addScaledVector(slideZ, moveSpeed);
    if (!checkCollision(trySlideZ, false)) {
      cameraHolder.position.copy(trySlideZ);
      return true;
    }

    // Não conseguiu mover.
    return false;
  }

// Checa quais teclas de movimentação estão pressionadas.
// Considera tanto as teclas de letras (WASD) quanto as setas direcionais.
const pressingForward = keyboard.pressed("W") || keyboard.pressed("up");    // Avançar.
const pressingBack = keyboard.pressed("S") || keyboard.pressed("down");     // Recuar.
const pressingLeft = keyboard.pressed("A") || keyboard.pressed("left");     // Mover para a esquerda.
const pressingRight = keyboard.pressed("D") || keyboard.pressed("right");   // Mover para a direita.

// Determina se o jogador está pressionando combinações de teclas para movimentação diagonal.
// A movimentação diagonal ocorre quando duas teclas ortogonais são pressionadas simultaneamente.
const diagonalLeft = pressingForward && pressingLeft;          // Frente + Esquerda.
const diagonalRight = pressingForward && pressingRight;       // Frente + Direita.
const diagonalBackLeft = pressingBack && pressingLeft;        // Trás + Esquerda.
const diagonalBackRight = pressingBack && pressingRight;      // Trás + Direita.

// Movimentos diagonais têm prioridade sobre movimentos simples.
// Isso evita múltiplos movimentos sequenciais no mesmo frame e garante suavidade na direção.

// Movimento: Frente + Esquerda
if (diagonalLeft) {
  // Cria um vetor resultante somando a direção da frente com a lateral esquerda.
  const diagonalDir = direction.clone().add(side).normalize();
  tryMove(diagonalDir);  // Tenta mover o jogador na direção diagonal.
  return;  // Sai da função para evitar múltiplos movimentos no mesmo frame.
}

// Movimento: Frente + Direita
if (diagonalRight) {
  // Soma a frente com o inverso da lateral (direita).
  const diagonalDir = direction.clone().add(side.clone().negate()).normalize();
  tryMove(diagonalDir);
  return;
}

// Movimento: Trás + Esquerda
if (diagonalBackLeft) {
  // Soma a direção oposta à frente com a lateral esquerda.
  const diagonalDir = direction.clone().negate().add(side).normalize();
  tryMove(diagonalDir);
  return;
}

// Movimento: Trás + Direita
if (diagonalBackRight) {
  // Soma a direção oposta à frente com a lateral direita (negativa de side).
  const diagonalDir = direction.clone().negate().add(side.clone().negate()).normalize();
  tryMove(diagonalDir);
  return;
}

// Se não houver combinações diagonais, verifica e executa movimentos cardinais (individuais).

// Movimento: Apenas para frente.
if (pressingForward) {
  tryMove(direction);
}

// Movimento: Apenas para trás.
if (pressingBack) {
  tryMove(direction.clone().negate());
}

// Movimento: Apenas para a esquerda, desde que não esteja indo para frente.
if (pressingLeft && !pressingForward) {
  tryMove(side);
}

// Movimento: Apenas para a direita, desde que não esteja indo para frente.
if (pressingRight && !pressingForward) {
  tryMove(side.clone().negate());
}
}

// Função que aplica gravidade ao jogador.
function applyGravity() {
  const groundCheckHeight = 0.1; // Distância para checar chão.
  const gravityStep = 0.15; // Valor da queda por frame.
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
      cameraHolder.position.y = minY; // Impede queda abaixo do mínimo.
    }
  }
}

// Função principal de renderização.
function render() {
  requestAnimationFrame(render); // Mantém o loop de animação.
  keyboardUpdate(); // Atualiza movimentação.
  applyGravity(); // Aplica gravidade.
  renderer.render(scene, camera); // Renderiza a cena.
}

// Exporta variáveis e funções para uso em outros arquivos.
export { scene, camera, cameraHolder, renderer, controls, keyboardUpdate, render };
