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
  normalMap,
} from "three/tsl";
import gsap from "gsap";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import EventEmitter from "./Utils/EventEmitter.js";

export default class LaserCanon extends EventEmitter {
  constructor(
    id,
    position = new THREE.Vector3(0, 1, 0),
    rotation = new THREE.Euler(0, 0, 0),
    simplexTexture,
    emissiveColorA = color(0x1111ff),
    emissiveColorB = color(0xff1111),
    emissiveStrength = float(20),
    texture,
    normal,
  ) {
    console.log("LaserCanon constructor");
    super();

    // _______________ Laser Shader Settings _______________//

    this.simplexTexture = simplexTexture;
    this.emissiveColorA = emissiveColorA;
    this.emissiveColorB = emissiveColorB;
    this.emissiveStrength = emissiveStrength;

    this.progressCanon = uniform(0);
    this.progressLight = uniform(0);
    this.progressLaser = uniform(0);

    // _______________ Laser Canon Settings _______________//
    this.id = id;
    this.position = position;
    this.rotation = rotation;

    this.texture = texture;
    this.normal = normal;

    this.group = new THREE.Group();
    this.setLoader();
    this.loadModel();

    this.tiling = vec2(3, 3);
    this.setCanonGeometry();

    this.setCanonMesh();

    this.setLaserGeometry();
    this.setLaserMaterial();
    this.setLaserMesh();

    this.setLightGeometry();
    this.setLightMaterial();
    this.setLightMesh();

    this.group.position.copy(this.position);
    this.group.rotation.copy(this.rotation);

    // _______________ Raycaster _______________//
    this.raycaster = new THREE.Raycaster();
    this.rayOrigin = new THREE.Vector3();
    this.rayDirection = new THREE.Vector3();

    this.raycaster.near = 0;
    this.raycaster.far = 12;

    this.hasHit = false;

    // _______________ State_______________//

    this.active = false;

    window.addEventListener("game:fire", (event) => {
      // console.log("La partie commence !");
      console.log(event.detail.id[0]);
      if (event.detail.id[0].includes(this.id)) {
        this.fireLaser();
      }
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

  loadModel() {
    this.loaders.gltfLoader.load(
      "./3D/turret2.glb",
      (gltf) => {
        this.model = gltf.scene;
        // this.model.rotation.y = -Math.PI * 0.58;
        this.model.position.y = -0.07;
        this.setCanonMaterial();
        this.group.add(this.model);
      },
      undefined,
      (error) => console.error("Impossible de charger character.glb :", error),
    );
  }

  fireLaser() {
    // d'abord le laser va s'allumer lentement, chemin de particules
    // puis le rayon va grossir d'un coup et l'anim va se jouer
    console.log("fire event received in LaserCanon", this.id);

    const dummy = { progressLight: 0, porgressLaser: 0, progressCanon: 0 };

    // gsap.to(dummy, {
    //   porgressLaser: 1,
    //   duration: 2,
    //   ease: "linear",
    //   onUpdate: () => {
    //     this.progressLaser.value = dummy.porgressLaser;
    //   },
    //   onComplete: () => {
    //     console.log("anim finished");
    //   },
    // });

    gsap.to(dummy, {
      progressLight: 1,
      duration: 2,
      ease: "none",
      onUpdate: () => {
        this.progressLight.value = dummy.progressLight;
      },
      onComplete: () => {
        console.log("anim finished");

        window.dispatchEvent(new CustomEvent("game:laser", {}));

        this.progressLight.value = 0;

        gsap.to(dummy, {
          porgressLaser: 1,
          duration: 2,
          ease: "linear",
          onUpdate: () => {
            this.progressLaser.value = dummy.porgressLaser;
          },
          onComplete: () => {
            window.dispatchEvent(
              new CustomEvent("game:endFire", {
                detail: { id: this.id },
              }),
            );
          },
        });

        gsap.to(dummy, {
          progressCanon: 1,
          duration: 2,
          ease: "elastic.out",
          onUpdate: () => {
            this.progressCanon.value = dummy.progressCanon;
          },
          onComplete: () => {
            console.log("anim finished");
          },
        });
      },
    });
  }

  // ______________________________ Canon ______________________________//

  setCanonGeometry() {
    // this.geometry = new THREE.PlaneGeometry(10, 10);
    this.canonGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
  }

  setCanonMaterial() {
    const coords = uv().mul(this.tiling);

    const mesh = this.model.getObjectByName("group2145190503");

    this.canonMaterial = new THREE.MeshStandardNodeMaterial();

    mesh.material = this.canonMaterial;

    const progress = this.progressCanon;

    this.canonMaterial.positionNode = Fn(() => {
      const size_y = sin(progress.mul(PI)).mul(0.2).add(1);
      const size_z = float(1).sub(sin(progress.mul(PI)).mul(0.3));

      const radiusFinal = vec3(1, size_y, size_z);
      positionLocal.mulAssign(radiusFinal);

      return positionLocal;
    })();

    this.canonMaterial.colorNode = Fn(() => {
      return texture(this.texture, coords);
    })();

    this.canonMaterial.normalNode = normalMap(texture(this.normal, coords));
  }

  setCanonMesh() {
    this.canonMesh = new THREE.Mesh(this.canonGeometry, this.canonMaterial);
    // this.canonMesh.position.copy(this.position);
    // this.canonMesh.rotation.copy(this.rotation);
    // this.group.add(this.canonMesh);
    // this.mesh.castShadow = true;
    // this.mesh.receiveShadow = true;
    // this.mesh.rotation.x = -Math.PI * 0.5;
    // this.renderOrder = -1;
  }

  // ______________________________ Laser ______________________________//

  // passer les materials et
  setLaserGeometry() {
    // this.geometry = new THREE.PlaneGeometry(10, 10);
    this.laserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 12, 32);
  }
  setLaserMaterial() {
    // const progress = time.mul(0.25).fract();
    // const progress = float(0);

    const progress = this.progressLaser;

    this.laserMaterial = new THREE.MeshStandardNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      // depthTest: true,
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

    // Position
    this.laserMaterial.positionNode = Fn(() => {
      // radius

      const radiusIn = progress.remap(0, 0.075);
      const radiusOut = progress.remap(0.075, 1, 1, 0.0);

      const radius = min(radiusIn, radiusOut).oneMinus().pow(2).oneMinus();

      const radiusFinal = vec3(radius, 1, radius);
      positionLocal.mulAssign(radiusFinal);

      return positionLocal;
    })();
  }
  setLaserMesh() {
    this.laserMesh = new THREE.Mesh(this.laserGeometry, this.laserMaterial);
    this.laserMesh.rotation.x = Math.PI * 0.5;
    this.laserMesh.position.z += 6;
    // this.laserMesh.position.z += 2.5;

    this.group.add(this.laserMesh);
  }

  // ______________________________ Light ______________________________//
  // passer les materials et
  setLightGeometry() {
    this.lightGeometry = new THREE.CylinderGeometry(0.01, 0.01, 12, 32);
  }
  setLightMaterial() {
    const progress = this.progressLight;
    // const progress = float(1);
    // const progress = time.mul(0.25).fract();

    this.lightMaterial = new THREE.MeshStandardNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      // depthTest: true,
    });

    this.lightMaterial.maskNode = Fn(() => {
      const noise1Uv = uv().mul(vec2(1, 5));

      const noise1 = texture(this.simplexTexture, noise1Uv).r;

      const noise2Uv = uv().mul(vec2(1, 5));
      const noise2 = texture(this.simplexTexture, noise2Uv).g;

      const finalNoise = noise1.add(noise2).div(2).pow(2);

      const lightProgress = progress.mul(0.7);

      return finalNoise.sub(lightProgress).greaterThan(0).oneMinus();

      // return vec3(finalNoise.sub(progress).greaterThan(0));
      // return vec3(noise1);
    })();

    this.lightMaterial.emissiveNode = Fn(() => {
      const emissiveColor = this.emissiveColorB;

      const emissiveStrength = this.emissiveStrength;
      return emissiveColor.mul(emissiveStrength);
    })();
  }
  setLightMesh() {
    this.lightMesh = new THREE.Mesh(this.lightGeometry, this.lightMaterial);
    this.lightMesh.rotation.x = Math.PI * 0.5;
    this.lightMesh.position.z += 6;
    // this.lightMesh.position.z += 2.5;

    this.group.add(this.lightMesh);
  }
}
