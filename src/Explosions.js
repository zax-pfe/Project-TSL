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
// import * from "three/tsl";

export default class Explosions {
  constructor(
    simplexTexture,
    max = 100,
    emissiveColorA = color(0x1111ff),
    emissiveColorB = color(0xff1111),
    emissiveStrength = float(20),
  ) {
    console.log("Explosions constructor");

    this.simplexTexture = simplexTexture;
    this.max = max;
    this.emissiveColorA = emissiveColorA;
    this.emissiveColorB = emissiveColorB;
    this.emissiveStrength = emissiveStrength;

    this.setGeometry();
    this.setMaterial();
    this.setMesh();
  }

  setGeometry() {
    this.geometry = new THREE.SphereGeometry(1, 32, 32);
  }

  setMaterial() {
    this.material = new THREE.MeshBasicNodeMaterial({
      color: 0x111111,
      side: THREE.DoubleSide,
    });

    const progress = time.mul(0.25).fract();

    // MAsk

    this.material.maskNode = Fn(() => {
      const noise1Uv = uv().mul(vec2(1, 3));
      const noise1 = texture(this.simplexTexture, noise1Uv).r;

      const noise2Uv = uv().mul(vec2(1, 5));
      const noise2 = texture(this.simplexTexture, noise2Uv).g;

      const finalNoise = noise1.add(noise2).div(2).pow(2);

      return finalNoise.sub(progress).greaterThan(0);

      // return vec3(finalNoise.sub(progress).greaterThan(0));
      // return vec3(noise1);
    })();

    // Emissive

    this.material.emissiveNode = Fn(() => {
      const emissiveMix = progress.smoothstep(0, 0.7);
      const emissiveColor = mix(this.emissiveColorA, this.emissiveColorB, emissiveMix);

      const backFacingMask = frontFacing.toFloat().oneMinus();
      const emissiveStrength = this.emissiveStrength.mul(backFacingMask);
      return emissiveColor.mul(emissiveStrength);
    })();

    // Position
    this.material.positionNode = Fn(() => {
      // radius

      const radiusIn = progress.remap(0, 0.075);
      const radiusOut = progress.remap(0.075, 1, 1, 0.3);

      const radiusFinal = min(radiusIn, radiusOut).oneMinus().pow(2).oneMinus();

      positionLocal.mulAssign(radiusFinal);

      // floor clamp
      positionLocal.y.assign(max(positionLocal.y, 0.1));

      return positionLocal;
    })();
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
  }
}
