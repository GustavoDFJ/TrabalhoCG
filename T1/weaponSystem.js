import * as THREE from 'three'; // Importa toda a biblioteca THREE.js para manipulação 3D
import { scene, collidableMeshes } from './sceneSetup.js'; // Importa a cena principal e os objetos que podem colidir

// Índice da arma atualmente selecionada (0 ou 1)
let currentWeapon = 0;

// Referência para a câmera e o renderizador, que serão configurados na inicialização
let cameraRef = null;
let rendererRef = null;

// Array para armazenar os projéteis ativos na cena
const projectiles = [];

// Distância máxima que um projétil pode percorrer antes de ser removido
const maxDistance = 500;

// Tempo entre disparos (em milissegundos)
const fireRate = 500; // 0.5 segundos

// Array para armazenar o timestamp do último disparo de cada arma (índice 0 e 1)
let lastShotTime = [0, 0];

// Controla se a arma pode atirar
let canShoot = [true, true];

// Array que armazenará os modelos das armas
let weaponModels = [];

// Flag para indicar se está disparando continuamente
let firing = false;

// Função que cria os modelos 3D das armas e adiciona ao array weaponModels
function createWeaponModels() {
  // Cria um cilindro verde (arma 0)
  const cylGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 32);
  const cylMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cylinder = new THREE.Mesh(cylGeometry, cylMaterial);
  cylinder.position.set(0, -0.5, -1); // Posiciona a arma em relação à câmera
  cylinder.rotation.x = Math.PI / 2; // Rotaciona para ficar apontando para frente
  weaponModels.push(cylinder);

  // Cria uma caixa amarela (arma 1)
  const boxGeometry = new THREE.BoxGeometry(0.5, 0.1, 5);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(0, -0.5, -1); // Posiciona em relação à câmera
  weaponModels.push(box);
}

// Atualiza a visibilidade dos modelos das armas, mostrando só o selecionado
function updateWeaponModel() {
  weaponModels.forEach((model, index) => {
    model.visible = index === currentWeapon; // só o modelo da arma atual fica visível
  });
}

// Função para trocar de arma usando o scroll do mouse
function switchWeapon(event) {
  if (event.deltaY < 0) {
    // Scroll para cima: avança para a próxima arma
    currentWeapon = (currentWeapon + 1) % 2;
  } else {
    // Scroll para baixo: volta para a arma anterior
    currentWeapon = (currentWeapon - 1 + 2) % 2;
  }
  updateWeaponModel(); // Atualiza a visibilidade das armas
}

// Função para iniciar o disparo contínuo ao clicar
function startFiring(event) {
  if (firing) return; // Se já estiver disparando, não faz nada
  firing = true;
  handleFire(event); // Dispara imediatamente
  animateFiring(event);
}

function animateFiring(event) {
  if (!firing) return;
  handleFire(event);
  requestAnimationFrame(() => animateFiring(event));
}

// Função para parar o disparo contínuo
function stopFiring() {
  firing = false;
}

// Função que controla quando deve disparar baseado no tempo e botão pressionado
function handleFire(event) {
  const now = performance.now();
  const weaponIndex = currentWeapon;

  if (!canShoot[weaponIndex]) return;

  // Verifica botões corretos para cada arma
  if ((weaponIndex === 0 && event.button !== 0 && event.button !== 2) ||
      (weaponIndex === 1 && event.button !== 2 && event.button !== 0)) {
    return;
  }

  if (now - lastShotTime[weaponIndex] >= fireRate) {
    canShoot[weaponIndex] = false;
    lastShotTime[weaponIndex] = now;
    
    spawnProjectile(weaponIndex === 0 ? 'sphere' : 'cube');
    
    // Habilita novo disparo após o fireRate
    setTimeout(() => {
      canShoot[weaponIndex] = true;
    }, fireRate);
  }
}

// Função que cria o projétil na cena
function spawnProjectile(type) {
  let geometry, material;

  // Define geometria e material baseado no tipo do projétil
  if (type === 'sphere') {
    geometry = new THREE.SphereGeometry(0.2, 16, 16);
    material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Vermelho
  } else {
    geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Azul
  }

  const projectile = new THREE.Mesh(geometry, material);

  // Obtém a posição global da ponta da arma para spawnar o projétil ali
  const weaponTip = new THREE.Vector3();
  weaponModels[currentWeapon].getWorldPosition(weaponTip);

  // Obtém a direção da câmera, para onde o projétil vai
  const direction = new THREE.Vector3();
  cameraRef.getWorldDirection(direction);
  direction.normalize();

  // Calcula o deslocamento para o projétil sair da ponta da arma
  let offset = 2; // valor padrão

  const weaponGeometry = weaponModels[currentWeapon].geometry;

  if (weaponGeometry.type === 'CylinderGeometry') {
    offset = weaponGeometry.parameters.height / 2; // metade do comprimento do cilindro
  } else if (weaponGeometry.type === 'BoxGeometry') {
    offset = weaponGeometry.parameters.depth / 2; // metade da profundidade da caixa
  }

  // Calcula a posição final do projétil deslocado na direção da arma
  const spawnPosition = weaponTip.clone().add(direction.clone().multiplyScalar(offset));

  // Posiciona o projétil na cena
  projectile.position.copy(spawnPosition);

  scene.add(projectile); // Adiciona projétil à cena

  // Armazena informações do projétil para controle de movimento e colisão
  projectiles.push({
    mesh: projectile,
    direction: direction.clone(),
    startPosition: spawnPosition.clone()
  });
}

// Atualiza a posição dos projéteis na cena e verifica colisões e distância máxima
function updateProjectiles() {
  const speed = 5;  // Velocidade dos projéteis

  // Itera ao contrário para poder remover projéteis da lista durante o loop
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    // Move o projétil na direção definida multiplicada pela velocidade
    p.mesh.position.addScaledVector(p.direction, speed);

    // Cria uma caixa delimitadora para o projétil
    const box = new THREE.Box3().setFromObject(p.mesh);
    let collided = false;

    // Verifica colisão com cada mesh que pode colidir
    for (const mesh of collidableMeshes) {
      const meshBox = new THREE.Box3().setFromObject(mesh);
      if (box.intersectsBox(meshBox)) {
        collided = true; // Colisão detectada
        break;
      }
    }

    // Calcula a distância percorrida pelo projétil desde o spawn
    const distance = p.mesh.position.distanceTo(p.startPosition);

    // Remove o projétil se colidiu ou ultrapassou a distância máxima
    if (collided || distance > maxDistance) {
      scene.remove(p.mesh); // Remove da cena
      projectiles.splice(i, 1); // Remove do array
    }
  }
}

// Função que inicializa o sistema de armas, recebe referências para câmera e renderer
function initWeaponSystem(camera, renderer) {
  cameraRef = camera;
  rendererRef = renderer;

  createWeaponModels(); // Cria os modelos das armas
  weaponModels.forEach(model => cameraRef.add(model)); // Anexa as armas à câmera para que sigam o movimento dela
  updateWeaponModel(); // Atualiza para mostrar a arma atual

  // Evento para trocar de arma com o scroll do mouse
  window.addEventListener('wheel', switchWeapon);

  // Eventos para começar e parar de atirar com os cliques do mouse
  rendererRef.domElement.addEventListener('pointerdown', startFiring);
  rendererRef.domElement.addEventListener('pointerup', stopFiring);
  rendererRef.domElement.addEventListener('pointerleave', stopFiring);
}

// Exporta as funções para serem usadas externamente
export { initWeaponSystem, updateProjectiles };
