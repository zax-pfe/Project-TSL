import * as THREE from "three/webgpu";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export default class Text {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.matcapTexture = this.textureLoader.load("textures/matcaps/8.png");
    this.matcapTexture.colorSpace = THREE.SRGBColorSpace;

    this.fontLoader = new FontLoader();
    this.mesh = new THREE.Group();

    this.startButtonEnabled = true;
    this.restartButtonEnabled = false;

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
    this.material = new THREE.MeshMatcapMaterial({ matcap: this.matcapTexture });
  }

  setMesh() {
    this.startText = new THREE.Mesh(this.startTextGeometry, this.material);
    this.restartText = new THREE.Mesh(this.restartTextGeometry, this.material);
    this.restartText.position.y = -1;
    this.mesh.add(this.startText, this.restartText);
  }
}
