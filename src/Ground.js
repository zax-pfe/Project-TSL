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
  normalMap,
  normalWorldGeometry,
} from "three/tsl";

export default class Ground {
  constructor(diffuse, normal) {
    console.log("Ground constructor");

    this.diffuse = diffuse;
    this.normal = normal;

    this.tiling = vec2(2, 2);
    this.sideBrightness = uniform(0.05);

    this.setGeometry();
    this.setMaterial();
    this.setMesh();
  }

  setGeometry() {
    // this.geometry = new THREE.PlaneGeometry(10, 10);
    this.geometry = new THREE.BoxGeometry(10, 10, 1, 1, 1, 1);
  }

  setMaterial() {
    const coords = uv().mul(this.tiling);
    this.material = new THREE.MeshStandardNodeMaterial({
      side: THREE.DoubleSide,
      // map: this.diffuse,
    });

    this.material.colorNode = Fn(() => {
      const baseColor = texture(this.diffuse, coords).rgb;
      // La normale geometrique reste independante de la normal map.
      const upward = normalWorldGeometry.y.clamp(0, 1);
      const brightness = mix(this.sideBrightness, float(1), upward);
      return baseColor.mul(brightness);
    })();

    this.material.normalNode = normalMap(texture(this.normal, coords));
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
