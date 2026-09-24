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

export default class Ground {
  constructor() {
    console.log("Ground constructor");

    this.setGeometry();
    this.setMaterial();
    this.setMesh();
  }

  setGeometry() {
    // this.geometry = new THREE.PlaneGeometry(10, 10);
    this.geometry = new THREE.BoxGeometry(10, 10, 1, 1, 1, 1);
  }

  setMaterial() {
    this.material = new THREE.MeshStandardNodeMaterial({
      color: 0x111fff,
      side: THREE.DoubleSide,
    });

    this.material.opacityNode = uv().sub(0.5).length().smoothstep(0.5, 0.2);
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.renderOrder = -1;
  }
}
