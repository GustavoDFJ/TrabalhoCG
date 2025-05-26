import { scene, createSceneObjects } from './sceneSetup.js';
import { cameraHolder, render, camera, renderer } from './camera.js';
import { InfoBox } from "../libs/util/util.js";
import { initWeaponSystem, updateProjectiles } from './weaponSystem.js';

scene.add(cameraHolder);
createSceneObjects();

initWeaponSystem(camera, renderer);

const info = new InfoBox();
info.add("Sistema de Armas:");
info.add("SCROLL → troca arma");
info.add("Cilindro → botão ESQUERDO → dispara esferas");
info.add("Paralelepípedo → botão DIREITO → dispara cubos");
info.show();

function gameLoop() {
  requestAnimationFrame(gameLoop);
  updateProjectiles();
}

render();
gameLoop();
