import * as THREE from 'three';
import { scene, collidableMeshes } from './sceneSetup.js';

// Variável que guarda qual arma está ativa: 0 = cilindro, 1 = paralelepípedo
let currentWeapon = 0; 

// Referências globais para câmera e renderer (serão setadas na inicialização)
let cameraRef = null;
let rendererRef = null;

// Array que guarda os projéteis disparados
const projectiles = [];

// Distância máxima que o projétil pode percorrer antes de ser removido
const maxDistance = 500;

// Tempo mínimo (ms) entre disparos consecutivos para cada arma (cadência de tiro)
const fireRate = 500; // 0.5 segundos

// Array que armazena o último tempo que cada arma atirou (índice 0 = cilindro, 1 = caixa)
let lastShotTime = [0, 0];

// Array para armazenar os modelos das armas (cilindro e paralelepípedo)
let weaponModels = [];

// Cria os modelos 3D das armas
function createWeaponModels() {
  // Cilindro deitado (rotacionado para ficar "deitado" no eixo X)
  const cylGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 32);
  const cylMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cylinder = new THREE.Mesh(cylGeometry, cylMaterial);
  cylinder.position.set(0, -0.5, -1);       // posiciona em frente e um pouco para baixo da câmera
  cylinder.rotation.x = Math.PI / 2;        // rotaciona 90° para deitar o cilindro
  weaponModels.push(cylinder);               // adiciona ao array de modelos

  // Paralelepípedo deitado (sem rotação no seu código, pode ajustar se quiser)
  const boxGeometry = new THREE.BoxGeometry(0.5, 0.1, 5);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(0, -0.5, -1);            // mesma posição que o cilindro
  // (Se quiser que o paralelepípedo também fique deitado, pode adicionar uma rotação aqui)
  weaponModels.push(box);                    // adiciona ao array de modelos
}

// Atualiza a visibilidade dos modelos de armas para mostrar só o ativo
function updateWeaponModel() {
  weaponModels.forEach((model, index) => {
    model.visible = index === currentWeapon; // só o modelo da arma atual fica visível
  });
}

// Função para trocar de arma com o scroll do mouse
function switchWeapon(event) {
  if (event.deltaY < 0) {
    // Scroll para cima → próxima arma (mod 2 para voltar ao início)
    currentWeapon = (currentWeapon + 1) % 2;
  } else {
    // Scroll para baixo → arma anterior
    currentWeapon = (currentWeapon - 1 + 2) % 2;
  }
  updateWeaponModel(); // atualiza a visibilidade dos modelos
}

// Função para disparar arma quando botão do mouse é pressionado
function fireWeapon(event) {
  const now = Date.now();

  // Se arma atual é o cilindro e botão esquerdo (0) for clicado
  if (currentWeapon === 0 && (event.button === 0 || event.button === 2)) {
    // Verifica se já passou o tempo de recarga para disparar de novo
    if (now - lastShotTime[0] >= fireRate) {
      lastShotTime[0] = now;           // atualiza último tempo de tiro
      spawnProjectile('sphere');       // cria projétil esfera (para cilindro)
    }
  }

  // Se arma atual é o paralelepípedo e botão direito (2) for clicado
  if (currentWeapon === 1 && (event.button === 2 || event.button === 0)) {
    if (now - lastShotTime[1] >= fireRate) {
      lastShotTime[1] = now;
      spawnProjectile('cube');         // cria projétil cubo (para paralelepípedo)
    }
  }
}

// Cria um projétil do tipo especificado (sphere ou cube)
function spawnProjectile(type) {
  let geometry, material;

  if (type === 'sphere') {
    geometry = new THREE.SphereGeometry(0.2, 16, 16);
    material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  } else {
    geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  }

  const projectile = new THREE.Mesh(geometry, material);

  // Pega a direção que a câmera está olhando (vetor normalizado)
  const direction = new THREE.Vector3();
  cameraRef.getWorldDirection(direction);
  direction.normalize();

  // Posiciona o projétil na posição da câmera
  projectile.position.copy(cameraRef.position);

  // Adiciona o projétil à cena
  scene.add(projectile);

  // Adiciona o projétil ao array, guardando mesh, direção e posição inicial
  projectiles.push({
    mesh: projectile,
    direction: direction.clone(),
    startPosition: cameraRef.position.clone()
  });
}

// Atualiza a posição dos projéteis na cena e verifica colisões/distância máxima
function updateProjectiles() {
  const speed = 1; // velocidade que os projéteis se movem

  // Percorre o array de trás para frente para permitir remoção segura
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    // Move o projétil na direção do disparo multiplicada pela velocidade
    p.mesh.position.addScaledVector(p.direction, speed);

    // Cria caixa delimitadora para o projétil
    const box = new THREE.Box3().setFromObject(p.mesh);
    let collided = false;

    // Checa colisão com cada mesh que pode colidir
    for (const mesh of collidableMeshes) {
      const meshBox = new THREE.Box3().setFromObject(mesh);
      if (box.intersectsBox(meshBox)) {
        collided = true;
        break;
      }
    }

    // Calcula a distância percorrida desde o ponto inicial do projétil
    const distance = p.mesh.position.distanceTo(p.startPosition);

    // Remove projétil se colidiu ou ultrapassou distância máxima
    if (collided || distance > maxDistance) {
      scene.remove(p.mesh);
      projectiles.splice(i, 1);
    }
  }
}

// Inicializa o sistema de armas, recebendo câmera e renderer como parâmetros
function initWeaponSystem(camera, renderer) {
  cameraRef = camera;
  rendererRef = renderer;

  createWeaponModels();                  // cria os modelos das armas
  weaponModels.forEach(model => cameraRef.add(model)); // adiciona armas como filhos da câmera
  updateWeaponModel();                   // mostra apenas arma ativa

  window.addEventListener('wheel', switchWeapon); // escuta o scroll para trocar arma

  // Usa o elemento DOM do renderer para ouvir eventos de clique e disparar armas
  rendererRef.domElement.addEventListener('mousedown', fireWeapon);
}

// Exporta as funções para uso externo (inicializar armas e atualizar projéteis)
export { initWeaponSystem, updateProjectiles };
