import * as THREE from "three/webgpu";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
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
  mul,
  smoothstep,
  frontFacing,
  positionLocal,
  min,
  uniform,
  max,
  normalMap,
  normalWorldGeometry,
} from "three/tsl";
import gsap from "gsap";

export default class Text {
  constructor(simplexTexture) {
    this.textureLoader = new THREE.TextureLoader();
    this.matcapTexture = this.textureLoader.load("textures/matcaps/8.png");
    this.matcapTexture.colorSpace = THREE.SRGBColorSpace;

    this.fontLoader = new FontLoader();
    this.mesh = new THREE.Group();

    this.simplexTexture = simplexTexture;

    this.startButtonEnabled = true;
    this.restartButtonEnabled = false;

    this.activeText = null;
    this.progress = uniform(0);
    this.buttonState = "start";
    this.animation = null;

    window.addEventListener("game:start", () => this.textHide());
    window.addEventListener("game:restart", () => this.textHide());
    window.addEventListener("game:stop", () => this.textAppear());

    this.emissiveColorA = color(0x1111ff);
    this.emissiveColorB = color(0xff1111);

    this.loadText();
  }

  loadText() {
    this.fontLoader.load("/Font/Minecrafter_Regular.json", (font) => {
      // Material
      this.font = font;
      this.setStartText();
      this.setRestartText();
      this.setMaterial();
      this.setMesh();
    });
  }

  setStartText() {
    this.startTextGeometry = new TextGeometry("START", {
      font: this.font,
      size: 0.5,
      depth: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5,
    });
    this.startTextGeometry.center();
  }

  setRestartText() {
    this.restartTextGeometry = new TextGeometry("RESTART", {
      font: this.font,
      size: 0.5,
      depth: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5,
    });
    this.restartTextGeometry.center();
  }

  setMaterial() {
    // this.material = new THREE.MeshMatcapMaterial({ matcap: this.matcapTexture });
    this.material = new THREE.MeshStandardNodeMaterial({
      // map: this.diffuse,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // const progress = time.mul(0.25).fract();
    // const progress = float(0);

    const progress = this.progress;

    this.material.emissiveNode = Fn(() => {
      const emissiveMix = progress.smoothstep(0, 0.7);

      const emissiveColor = mix(this.emissiveColorA, this.emissiveColorB, emissiveMix);

      const emissiveStrength = float(1);
      return emissiveColor.mul(emissiveStrength);
    })();

    this.material.maskNode = Fn(() => {
      const noise1Uv = uv().mul(vec2(0.3, 0.3));

      const noise1 = texture(this.simplexTexture, noise1Uv).r;

      const noise2Uv = uv().mul(vec2(0.3, 0.3));
      const noise2 = texture(this.simplexTexture, noise2Uv).g;
      const finalNoise = noise1.add(noise2).div(2);

      return progress.lessThanEqual(0).or(finalNoise.sub(progress).greaterThan(0));
    })();

    this.material.colorNode = Fn(() => {
      return vec3(1, 0, 0);
    })();
  }

  setMesh() {
    this.startText = new THREE.Mesh(this.startTextGeometry, this.material);
    this.restartText = new THREE.Mesh(this.restartTextGeometry, this.material);
    this.restartText.position.y = -1;
    this.mesh.add(this.startText, this.restartText);
    this.startText.visible = this.buttonState === "start";
    this.restartText.visible = false;
    this.activeText = this.startText.visible ? this.startText : null;
    if (this.buttonState === "restart") {
      this.buttonState = "playing";
      this.textAppear();
    }
  }

  textHide() {
    if (this.buttonState === "playing") return;
    this.buttonState = "playing";
    this.startButtonEnabled = false;
    this.restartButtonEnabled = false;
    this.animation?.kill();
    const text = this.activeText;
    this.activeText = null;
    if (!text) return;

    this.animation = gsap.to(this.progress, {
      value: 1,
      duration: 1,
      ease: "power1.out",
      onComplete: () => {
        text.visible = false;
      },
    });
  }

  textAppear() {
    // Plusieurs lasers peuvent signaler un hit pendant la meme partie.
    if (this.buttonState === "restart") return;
    this.buttonState = "restart";
    this.startButtonEnabled = false;
    this.restartButtonEnabled = false;
    this.animation?.kill();
    if (!this.restartText) return;

    this.startText.visible = false;
    this.restartText.visible = true;
    this.activeText = this.restartText;
    this.progress.value = 1;

    this.animation = gsap.to(this.progress, {
      value: 0,
      duration: 1,
      ease: "power1.out",
      onComplete: () => {
        this.restartButtonEnabled = true;
      },
    });
  }
}
