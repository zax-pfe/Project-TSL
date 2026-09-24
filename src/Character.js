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

export default class Character {
  constructor() {
    console.log("Character constructor");

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
}
