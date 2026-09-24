import * as THREE from "three/tsl";
import EventEmitter from "./Utils/EventEmitter.js";

export default class StateMachine extends EventEmitter {
  constructor() {
    super();
    this.states = {};
    this.currentState = null;

    this.laserToFire = null;
  }

  setLaserToFire(CanonLaserId) {
    this.laserToFire = CanonLaserId;
  }

  fire = () => {
    this.trigger("fire", [this.laserToFire]);
  };
}
