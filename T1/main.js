// Importa a cena e a função que cria os objetos da cena
import { scene, createSceneObjects } from './sceneSetup.js';

// Importa o suporte da câmera, a função de renderização, a câmera e o renderizador
import { cameraHolder, render, camera, renderer } from './camera.js';

// Importa a InfoBox (caixa de informações) da biblioteca utilitária
import { InfoBox } from "../libs/util/util.js";

// Importa a inicialização e atualização do sistema de armas
import { initWeaponSystem, updateProjectiles } from './weaponSystem.js';

// Adiciona o suporte da câmera à cena (para movimentação e controle)
scene.add(cameraHolder);

// Cria e adiciona os objetos da cena (paredes, áreas coloridas, escadas, etc.)
createSceneObjects();

// Inicializa o sistema de armas, passando a câmera e o renderizador
initWeaponSystem(camera, renderer);

// Cria uma caixa de informações para instruções ao usuário
const info = new InfoBox();
info.add("Liberar Movimento da Camera → de um clique na tela"); 
info.add("Liberar Mouse → apertar esc"); 
info.add("Movimentar → W/A/S/D");  
info.add("Troca de Arma → SCROLL");  
info.add("Disparar Arma → botão ESQUERDO/DIREITO do Mouse"); 
info.show();  

// Função de loop do jogo, chamada a cada frame
function gameLoop() {
  requestAnimationFrame(gameLoop);  // Chama gameLoop novamente no próximo frame
  updateProjectiles();  // Atualiza a posição e estado dos projéteis
}

// Renderiza a cena inicialmente
render();

// Inicia o loop do jogo
gameLoop();
