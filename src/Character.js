import * as THREE from "three/webgpu";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  color,
  float,
  time,
  Fn,
  vec3,
  texture,
  uv,
  vec2,
  mix,
  materialColor,
  smoothstep,
  frontFacing,
  positionLocal,
  min,
  uniform,
  max,
  sin,
  PI,
} from "three/tsl";

import gsap from "gsap";

export default class Character {
  constructor(simplexTexture) {
    console.log("Character constructor");
    this.simplexTexture = simplexTexture;

    this.speed = 3;
    this.rotationSpeed = 12;
    this.animationBlendDuration = 0.2;
    this.runWeight = 0;
    this.actions = {};
    this.translation = new THREE.Vector3();

    this.isidle = true;
    this.isWalking = false;

    this.progress = uniform(0);

    this.setMesh();
    this.setLoader();
    this.loadModel();
    this.setBoundingBox();

    window.addEventListener("game:hit", (event) => {
      this.characterHit();
    });
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

  setBoundingBox() {
    this.BoundingBoxGeometry = new THREE.SphereGeometry(2, 32, 32);
    this.BoundingBoxMaterial = new THREE.MeshBasicNodeMaterial({
      color: 0xff1111,
      transparent: true,
      opacity: 0.1,
      // Le volume de collision ne doit pas masquer le personnage transparent.
      depthWrite: false,
    });
    this.BoundingBoxMesh = new THREE.Mesh(this.BoundingBoxGeometry, this.BoundingBoxMaterial);
    this.BoundingBoxMesh.position.y = 1;
    this.mesh.add(this.BoundingBoxMesh);
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
        this.model.scale.set(1, 1, 1);
        this.model.traverse((child) => {
          if (child.isMesh) child.castShadow = true;
        });
        this.setMaterial();

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

  setMaterial() {
    // const progress = time.mul(0.25).fract();
    const progress = this.progress;

    const body = this.model.getObjectByName("body");
    this.bodyMaterial = body.material;
    this.bodyMaterial.transparent = true;

    this.bodyMaterial.maskNode = Fn(() => {
      const noise1Uv = uv().mul(vec2(50, 1));

      const noise1 = texture(this.simplexTexture, noise1Uv).r;

      const noise2Uv = uv().mul(vec2(50, 1));
      const noise2 = texture(this.simplexTexture, noise2Uv).g;
      const finalNoise = noise1.add(noise2).div(2);

      return finalNoise.sub(progress).greaterThan(0);
    })();

    this.bodyMaterial.colorNode = Fn(() => {
      const darkerColor = mix(materialColor.rgb, color(0x000000), 0.7);

      return mix(darkerColor.rgb, color(0x000000), progress.mul(2));
    })();
  }

  characterHit() {
    console.log("character burning");

    const dummy = { progress: 0 };

    gsap.to(dummy, {
      progress: 1,
      duration: 2,
      ease: "linera",
      onUpdate: () => {
        this.progress.value = dummy.progress;
      },
      onComplete: () => {
        console.log("anim finished");
      },
    });
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

      if (this.isidle) {
        console.log("was idle");
        this.isidle = false;
        this.isWalking = true;

        window.dispatchEvent(new CustomEvent("game:walking", {}));
      }
    } else {
      if (this.isWalking) {
        console.log("was walking");
        this.isWalking = false;
        this.isidle = true;
        window.dispatchEvent(new CustomEvent("game:stopWalking", {}));
      }
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
