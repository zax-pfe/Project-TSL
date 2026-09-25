import * as THREE from "three/webgpu";

export default class RaycasterManager {
  constructor(scene) {
    this.scene = scene;
    this.lasers = new Map();
    this.raycaster = new THREE.Raycaster();
    this.origin = new THREE.Vector3();
    this.end = new THREE.Vector3();
    this.direction = new THREE.Vector3();
  }

  addLaser(laser) {
    this.lasers.set(laser, new Set());
    laser.laserMesh.userData.ignoreLaserRaycast = true;
    laser.lightMesh.userData.ignoreLaserRaycast = true;
  }

  update() {
    // Actualiser les matrices avant le rendu, apres le deplacement du personnage.
    this.scene.updateMatrixWorld(true);

    for (const [laser, hitObjects] of this.lasers) {
      if (!laser.active) {
        hitObjects.clear();
        continue;
      }

      // Les extremites du cylindre suivent aussi la rotation et l'echelle du canon.
      const halfLength = laser.laserGeometry.parameters.height / 2;
      this.origin.set(0, -halfLength, 0).applyMatrix4(laser.laserMesh.matrixWorld);
      this.end.set(0, halfLength, 0).applyMatrix4(laser.laserMesh.matrixWorld);
      this.direction.subVectors(this.end, this.origin);
      this.raycaster.far = this.direction.length();
      this.raycaster.set(this.origin, this.direction.normalize());

      const targets = [];
      const collect = (object) => {
        if (!object.visible || object === laser.group || object.userData.ignoreLaserRaycast) return;
        if (object.isMesh) targets.push(object);
        for (const child of object.children) collect(child);
      };
      collect(this.scene);

      // Les intersections sont triees de la plus proche a la plus lointaine.
      for (const hit of this.raycaster.intersectObjects(targets, false)) {
        if (hitObjects.has(hit.object)) continue;
        hitObjects.add(hit.object);

        if (hit.object.name == "characterBoundingBox") {
          // console.log("character hit");
          window.dispatchEvent(new CustomEvent("game:hit", {}));
          // window.dispatchEvent(new CustomEvent("game:stop", {}));
        }

        // console.log(`[Laser ${laser.id}] Objet touche : ${hit.object.name}`, {
        //   object: hit.object,
        //   distance: hit.distance,
        //   point: hit.point,
        // });
      }
    }
  }
}
