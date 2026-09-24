import EventEmitter from "./Utils/EventEmitter";

export default class GameManager extends EventEmitter {
  constructor() {
    super();
    console.log("GameManager");
  }
  setLaserToFire(CanonLaserId) {
    this.laserToFire = CanonLaserId;
  }

  fire = () => {
    this.trigger("fire", [this.laserToFire]);
  };
}
