import * as THREE from "three/tsl";
import EventEmitter from "./Utils/EventEmitter.js";

export default class StateMachine extends EventEmitter {
  constructor() {
    super();
    this.states = { 0: "Intro", 1: "Game", 2: "Outro" };
    this.currentState = "Intro";

    window.addEventListener("game:hit", () => {
      this.stop();
    });
  }

  start() {
    console.log("started");
    this.currentState = "Game";
    window.dispatchEvent(new CustomEvent("game:start", {}));
  }
  stop() {
    this.currentState = "Outro";
    window.dispatchEvent(new CustomEvent("game:stop", {}));
  }

  restart() {
    this.currentState = "Game";
    window.dispatchEvent(new CustomEvent("game:restart", {}));
  }
}
