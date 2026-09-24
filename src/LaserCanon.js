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
  sin,
  PI,
} from "three/tsl";
import gsap from "gsap";

import EventEmitter from "./Utils/EventEmitter.js";

export default class LaserCanon extends EventEmitter {
  constructor(
    id,
    stateMachine,
    position = new THREE.Vector3(0, 1, 0),
    rotation = new THREE.Euler(0, 0, 0),
    simplexTexture,
    emissiveColorA = color(0x1111ff),
    emissiveColorB = color(0xff1111),
    emissiveStrength = float(20),
  ) {
    console.log("LaserCanon constructor");
    super();

    // _______________ Laser Shader Settings _______________//

    this.simplexTexture = simplexTexture;
    this.emissiveColorA = emissiveColorA;
    this.emissiveColorB = emissiveColorB;
    this.emissiveStrength = emissiveStrength;

    this.progress = uniform(0);

    // _______________ Laser Canon Settings _______________//
    this.id = id;
    this.stateMachine = stateMachine;
    this.position = position;
    this.rotation = rotation;

    this.group = new THREE.Group();

    this.setCanonGeometry();
    this.setCanonMaterial();
    this.setCanonMesh();

    this.setLaserGeometry();
    this.setLaserMaterial();
    this.setLaserMesh();

    this.group.position.copy(this.position);
    this.group.rotation.copy(this.rotation);

    this.stateMachine.on("fire", (id) => {
      if (id.includes(this.id)) {
        this.fireLaser();
      }
    });
  }

  fireLaser() {
    // d'abord le laser va s'allumer lentement, chemin de particules
    // puis le rayon va grossir d'un coup et l'anim va se jouer
    console.log("fire event received in LaserCanon", this.id);

    const dummy = { progress: 0 };

    gsap.to(dummy, {
      progress: 1,
      duration: 2,
      ease: "linear",
      onUpdate: () => {
        this.progress.value = dummy.progress;
      },
      onComplete: () => {
        console.log("anim finished");
      },
    });
  }

  // ______________________________ Canon ______________________________//

  setCanonGeometry() {
    // this.geometry = new THREE.PlaneGeometry(10, 10);
    this.canonGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
  }

  setCanonMaterial() {
    this.canonMaterial = new THREE.MeshStandardNodeMaterial({
      color: 0xff0000, //red
    });

    // this.material.opacityNode = uv().sub(0.5).length().smoothstep(0.5, 0.2);
  }

  setCanonMesh() {
    this.canonMesh = new THREE.Mesh(this.canonGeometry, this.canonMaterial);
    // this.canonMesh.position.copy(this.position);
    // this.canonMesh.rotation.copy(this.rotation);
    this.group.add(this.canonMesh);
    // this.mesh.castShadow = true;
    // this.mesh.receiveShadow = true;
    // this.mesh.rotation.x = -Math.PI * 0.5;
    // this.renderOrder = -1;
  }

  // ______________________________ Laser ______________________________//

  setLaserGeometry() {
    // this.geometry = new THREE.PlaneGeometry(10, 10);
    this.laserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 12, 32);
  }
  setLaserMaterial() {
    // const progress = time.mul(0.25).fract();
    // const progress = float(0);

    const progress = this.progress;

    this.laserMaterial = new THREE.MeshStandardNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    this.laserMaterial.emissiveNode = Fn(() => {
      const emissiveMix = progress.smoothstep(0, 0.7);
      const emissiveColor = mix(this.emissiveColorA, this.emissiveColorB, emissiveMix);

      const emissiveStrength = this.emissiveStrength;
      return emissiveColor.mul(emissiveStrength);
    })();

    this.laserMaterial.opacityNode = Fn(() => {
      const ratio = progress;
      return sin(ratio.mul(PI));
    })();
  }
  setLaserMesh() {
    this.laserMesh = new THREE.Mesh(this.laserGeometry, this.laserMaterial);
    this.laserMesh.rotation.x = Math.PI * 0.5;
    this.laserMesh.position.z += 6;
    // this.laserMesh.position.z += 2.5;

    this.group.add(this.laserMesh);
  }
}
