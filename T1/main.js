import { scene, createSceneObjects } from './sceneSetup.js';
import { cameraHolder, render } from './camera.js';
import { InfoBox } from "../libs/util/util.js";

// Adiciona o holder da câmera na cena (que vem do sceneSetup.js)
scene.add(cameraHolder);

// Cria os objetos do cenário (chão, paredes, áreas, etc)
createSceneObjects();

// InfoBox com instruções
const info = new InfoBox();
info.add("First-person shooter");
info.addParagraph();
info.add("Use W/A/S/D para mover");
info.add("Clique na tela para travar o mouse");
info.show();

// Inicia o loop de renderização
render();
