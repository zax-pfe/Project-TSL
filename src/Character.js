import * as THREE from "three/webgpu";
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
  smoothstep,
  frontFacing,
  positionLocal,
  min,
  uniform,
  max,
} from "three/tsl";
import { Console } from "three/examples/jsm/inspector/tabs/Console.js";

export default class Character {
  constructor() {
    console.log("Character constructor");

    this.speed = 3; // Unites par seconde.
    this.translation = new THREE.Vector3();

    this.setGeometry();
    this.setMaterial();
    this.setMesh();
  }

  setGeometry() {
    // this.geometry = new THREE.PlaneGeometry(10, 10);
    this.geometry = new THREE.CapsuleGeometry(0.3, 0.5, 32, 32);
  }

  setMaterial() {
    this.material = new THREE.MeshStandardNodeMaterial({
      color: 0x800080, // purple
    });
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.y = 1;
    this.renderOrder = 1;
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
    this.mesh.position.add(translation);
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -5, 5);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -5, 5);
  }
}
