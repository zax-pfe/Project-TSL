import * as THREE from "three/webgpu";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class Character {
  constructor() {
    console.log("Character constructor");

    this.speed = 3; // Unites par seconde.
    this.rotationSpeed = 12;
    this.animationBlendDuration = 0.2; // Secondes pour passer de idle a run.
    this.runWeight = 0;
    this.actions = {};
    this.translation = new THREE.Vector3();

    this.setMesh();
    this.setLoader();
    this.loadModel();
  }

  setLoader() {
    this.loaders = {};
    this.DRACOLoader = new DRACOLoader();
    this.DRACOLoader.setDecoderPath("draco/");
    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.gltfLoader.setDRACOLoader(this.DRACOLoader);
    this.loaders.textureLoader = new THREE.TextureLoader();
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();
  }

  setMesh() {
    // Le groupe reste dans la scene pendant le chargement du modele.
    this.mesh = new THREE.Group();
    this.mesh.scale.set(0.5, 0.5, 0.5);
    this.mesh.position.y = 0.5;
  }

  loadModel() {
    this.loaders.gltfLoader.load(
      "./3D/character.glb",
      (gltf) => {
        this.model = gltf.scene;
        this.mesh.add(this.model);
        this.mixer = new THREE.AnimationMixer(this.model);
        for (const name of ["idle", "run"]) {
          const clip = THREE.AnimationClip.findByName(gltf.animations, name);
          if (clip) {
            this.actions[name] = this.mixer.clipAction(clip);
            this.actions[name].setEffectiveWeight(name === "idle" ? 1 : 0).play();
          }
        }
      },
      undefined,
      (error) => console.error("Impossible de charger character.glb :", error),
    );
  }

  computeMovement(movement, deltaTime) {
    this.translation.set(movement.right, 0, -movement.forward);
    // Limiter les diagonales tout en conservant les petites valeurs analogiques.
    this.translation.clampLength(0, 1);
    this.translation.multiplyScalar(this.speed * deltaTime);
    return this.translation;
  }

  animate(movement, deltaTime) {
    const translation = this.computeMovement(movement, deltaTime);
    const previousX = this.mesh.position.x;
    const previousZ = this.mesh.position.z;
    this.mesh.position.add(translation);
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -5, 5);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -5, 5);

    const dx = this.mesh.position.x - previousX;
    const dz = this.mesh.position.z - previousZ;
    const isMoving = dx * dx + dz * dz > 1e-10;
    if (isMoving) {
      const targetAngle = Math.atan2(dx, dz);
      const angleDifference = targetAngle - this.mesh.rotation.y;
      // Prendre le chemin le plus court, meme autour de -PI / PI.
      const shortestAngle = Math.atan2(Math.sin(angleDifference), Math.cos(angleDifference));
      this.mesh.rotation.y += shortestAngle * (1 - Math.exp(-this.rotationSpeed * deltaTime));
    }

    if (this.actions.idle && this.actions.run) {
      const blendStep = deltaTime / this.animationBlendDuration;
      this.runWeight = THREE.MathUtils.clamp(
        this.runWeight + (isMoving ? blendStep : -blendStep),
        0,
        1,
      );
      this.actions.idle.setEffectiveWeight(1 - this.runWeight);
      this.actions.run.setEffectiveWeight(this.runWeight);
    }
    this.mixer?.update(deltaTime);
  }
}
