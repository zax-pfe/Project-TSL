import * as THREE from "three/webgpu";
import gsap from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Inspector } from "three/addons/inspector/Inspector.js";
import { SkyMesh } from "three/addons/objects/SkyMesh.js";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { chromaticAberration } from "three/addons/tsl/display/ChromaticAberrationNode.js";
import { film } from "three/addons/tsl/display/FilmNode.js";

import {
  pass,
  uv,
  color,
  float,
  uniform,
  vec2,
  vec3,
  vec4,
  time,
  sin,
  convertToTexture,
} from "three/tsl";
import Explosions from "./Explosions.js";
import Ground from "./Ground.js";
import LaserCanon from "./LaserCanon.js";
import Character from "./Character.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import StateMachine from "./StateMachine.js";
import GameManager from "./GameManager.js";
import SoundManager from "./SoundManager.js";
import RaycasterManager from "./RaycasterManager.js";

// idée sol reaction au pas de l'utilisateur
// trainée/neige

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.threejs");

// Scene
const scene = new THREE.Scene();
const raycasterManager = new RaycasterManager(scene);

// Loaders
const textureLoader = new THREE.TextureLoader();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 12;
camera.position.y = 9;
camera.position.z = 11.5;

scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = false;
controls.enabled = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGPURenderer({
  canvas: canvas,
  antialias: true,
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.transmitted = false;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x111111);
renderer.inspector = new Inspector();

// ______________________________ POST PROCESSING ______________________________//

const renderPipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass(scene, camera);
const scenePassColor = scenePass.getTextureNode("output");

const bloomPass = bloom(scenePassColor);
bloomPass.threshold.value = 0;
bloomPass.strength.value = 0.05;

const chromaticStrength = uniform(0);
const chromaticPass = chromaticAberration(
  scenePassColor.add(bloomPass),
  chromaticStrength,
  vec2(0.5, 0.5),
);

const shakeStrength = uniform(0.0);
const shakeSpeed = uniform(1);
const shakeTime = time.mul(shakeSpeed);
const shakeOffset = vec2(
  sin(shakeTime.mul(43))
    .add(sin(shakeTime.mul(71)))
    .mul(0.5),
  sin(shakeTime.mul(53))
    .add(sin(shakeTime.mul(89)))
    .mul(0.5),
).mul(shakeStrength);
// Recadrer legerement pour garder les bords dans l'image pendant le shake.
const shakeUv = uv()
  .sub(0.5)
  .mul(float(1).sub(shakeStrength.mul(2)))
  .add(0.5)
  .add(shakeOffset);
const shakePass = convertToTexture(chromaticPass).sample(shakeUv);

const filmEnabled = uniform(true);
const filmIntensity = uniform(0.5);
const filmGrayscale = uniform(false);
const filmPass = film(shakePass, filmIntensity);
const filmLuminance = filmPass.rgb.dot(vec3(0.3, 0.59, 0.11));
const filmColor = filmGrayscale.select(vec4(vec3(filmLuminance), filmPass.a), filmPass);
renderPipeline.outputNode = filmEnabled.select(filmColor, shakePass);

const bloomGui = renderer.inspector.createParameters("Bloom").close();
bloomGui.add(bloomPass.threshold, "value", 0, 2, 0.01).name("threshold");
bloomGui.add(bloomPass.strength, "value", 0, 2, 0.01).name("strength");

const filmGui = renderer.inspector.createParameters("Film").close();
filmGui.add(filmEnabled, "value").name("enabled");
filmGui.add(filmIntensity, "value", 0, 1, 0.01).name("intensity");
filmGui.add(filmGrayscale, "value").name("grayscale");

const chromaticGui = renderer.inspector.createParameters("Chromatic aberration").close();
chromaticGui.add(chromaticStrength, "value", 0, 1, 0.01).name("strength");

const shakeGui = renderer.inspector.createParameters("Screen shake").close();
shakeGui.add(shakeStrength, "value", 0, 0.01, 0.0001).name("strength");
shakeGui.add(shakeSpeed, "value", 0.1, 3, 0.1).name("speed");

const laserEffects = { progress: 0 };

window.addEventListener("game:laser", () => {
  gsap.to(laserEffects, {
    progress: 1,
    duration: 1,
    repeat: 1,
    yoyo: true,
    ease: "power1.inOut",
    onUpdate: () => {
      shakeStrength.value = laserEffects.progress * 0.003;
      chromaticStrength.value = laserEffects.progress;
    },
  });
});

// ______________________________ Movements Input ______________________________//
let movement;
movement = { forward: 0, right: 0 };

window.addEventListener("keydown", (event) => {
  if (event.key === "z" || event.key === "ArrowUp") movement.forward = 1;
  if (event.key === "s" || event.key === "ArrowDown") movement.forward = -1;
  if (event.key === "q" || event.key === "ArrowLeft") movement.right = -1;
  if (event.key === "d" || event.key === "ArrowRight") movement.right = 1;
});

window.addEventListener("keyup", (event) => {
  if (
    event.key === "z" ||
    event.key === "s" ||
    event.key === "ArrowUp" ||
    event.key === "ArrowDown"
  )
    movement.forward = 0;
  if (
    event.key === "q" ||
    event.key === "d" ||
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight"
  )
    movement.right = 0;
});

// ______________________________ Control ______________________________//
const control = new TransformControls(camera, renderer.domElement);
control.setMode("translate");

// Suspendre la rotation de la caméra pendant la manipulation du gizmo.
control.addEventListener("dragging-changed", function (event) {
  controls.enabled = !event.value;
});

const gizmo = control.getHelper();
gizmo.userData.ignoreLaserRaycast = true;
scene.add(gizmo);

// ______________________________ Sound ______________________________//

const soundManger = new SoundManager();
// ______________________________ State Machine ______________________________//

const stateMachine = new StateMachine();
// const gameManagerGui = renderer.inspector.createParameters("gameManager").close();
// gameManagerGui.add(gameManager, "fire").name("Fire");
// stateMachine

// game manager, recupere tout les event du jeux, conteni les

// ______________________________ Game Manager ______________________________//
const gameManager = new GameManager();
gameManager.setLaserToFire([0, 3, 6]);

const gameManagerGui = renderer.inspector.createParameters("gameManager").close();
gameManagerGui.add(gameManager, "fire").name("Fire");
gameManagerGui.add(gameManager, "hit").name("hit");

// ______________________________ Floor ______________________________//
{
  const texture = await textureLoader.loadAsync("./textureColor.png");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  const normal = await textureLoader.loadAsync("./Vol_18_2_Normal.png");
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;

  const ground = new Ground(texture, normal);
  scene.add(ground.mesh);
}

// ______________________________ Laser ______________________________//

const simplexTexture = await textureLoader.loadAsync("./simplex-tiling-noise-256x256.png");
simplexTexture.wrapS = THREE.RepeatWrapping;
simplexTexture.wrapT = THREE.RepeatWrapping;

const texture = await textureLoader.loadAsync("./textureColor.png");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.colorSpace = THREE.SRGBColorSpace;
const normal = await textureLoader.loadAsync("./Vol_18_2_Normal.png");
normal.wrapS = THREE.RepeatWrapping;
normal.wrapT = THREE.RepeatWrapping;

// const perlinTexture = await textureLoader.loadAsync("./perlin.jpg");
// perlinTexture.wrapS = THREE.RepeatWrapping;
// perlinTexture.wrapT = THREE.RepeatWrapping;

function createLaserCanon(id, position, rotation, withControl = true) {
  const laser_canon = new LaserCanon(
    id,
    position,
    rotation,
    simplexTexture,
    uniform(color(0x1111ff)),
    uniform(color(0xff1111)),
    uniform(float(30)),
    texture,
    normal,
  );

  scene.add(laser_canon.group);
  raycasterManager.addLaser(laser_canon);

  if (withControl) {
    control.attach(laser_canon.group);
  }
}

let z_laser_1 = -6;
let y_laser_1 = 1;

let rotatation_laser_1 = new THREE.Euler(0, 0, 0);

createLaserCanon(0, new THREE.Vector3(4.5, y_laser_1, z_laser_1), rotatation_laser_1, false);
createLaserCanon(1, new THREE.Vector3(3, y_laser_1, z_laser_1), rotatation_laser_1, false);
createLaserCanon(2, new THREE.Vector3(1.5, y_laser_1, z_laser_1), rotatation_laser_1, false);
createLaserCanon(3, new THREE.Vector3(0, y_laser_1, z_laser_1), rotatation_laser_1, false);
createLaserCanon(4, new THREE.Vector3(-1.5, y_laser_1, z_laser_1), rotatation_laser_1, false);
createLaserCanon(5, new THREE.Vector3(-3, y_laser_1, z_laser_1), rotatation_laser_1, false);
createLaserCanon(6, new THREE.Vector3(-4.5, y_laser_1, z_laser_1), rotatation_laser_1, false);

let y_laser_2 = 1;
let x_laser_2 = -6;

let rotatation_laser_2 = new THREE.Euler(0, Math.PI * 0.5, 0);

createLaserCanon(7, new THREE.Vector3(x_laser_2, y_laser_2, 4.5), rotatation_laser_2, false);
createLaserCanon(8, new THREE.Vector3(x_laser_2, y_laser_2, 3), rotatation_laser_2, false);
createLaserCanon(9, new THREE.Vector3(x_laser_2, y_laser_2, 1.5), rotatation_laser_2, false);
createLaserCanon(10, new THREE.Vector3(x_laser_2, y_laser_2, 0), rotatation_laser_2, false);
createLaserCanon(11, new THREE.Vector3(x_laser_2, y_laser_2, -1.5), rotatation_laser_2, false);
createLaserCanon(12, new THREE.Vector3(x_laser_2, y_laser_2, -3), rotatation_laser_2, false);
createLaserCanon(13, new THREE.Vector3(x_laser_2, y_laser_2, -4.5), rotatation_laser_2, false);

// ______________________________ Character ______________________________//

const character = new Character(simplexTexture);
scene.add(character.mesh);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(1, 0.5, -0.75).normalize().multiplyScalar(10);
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.castShadow = true;
directionalLight.shadow.radius = 5;
directionalLight.shadow.normalBias = 0.1;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffa985, 1);
scene.add(ambientLight);

// Debug
const lightsGui = renderer.inspector.createParameters("Lights").close();

lightsGui.addColor(directionalLight, "color").name("directionalColor");
lightsGui.add(directionalLight, "intensity", 0, 5, 0.01).name("directionalIntensity");

lightsGui.addColor(ambientLight, "color").name("ambientColor");
lightsGui.add(ambientLight, "intensity", 0, 5, 0.01).name("ambientIntensity");

/**
 * Animate
 */
let previousTime;
const tick = (currentTime) => {
  // Temps en secondes, limite pour eviter un saut au retour sur l'onglet.
  const deltaTime =
    previousTime === undefined ? 0 : Math.min((currentTime - previousTime) / 1000, 0.05);
  previousTime = currentTime;
  // Mettre à jour la caméra (notamment son amortissement).
  controls.update();

  // console.log(camera.position);

  character.animate(movement, deltaTime);
  raycasterManager.update();

  // Dessiner la scène et le gizmo avec le post-traitement.
  // TransformControls modifie l'objet directement via les événements souris.
  renderPipeline.render();
};

// Enregistrer une seule fois la fonction que Three.js appellera à chaque frame.
renderer.setAnimationLoop(tick);
