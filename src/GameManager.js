import EventEmitter from "./Utils/EventEmitter";

export default class GameManager extends EventEmitter {
  constructor() {
    super();
    console.log("GameManager");
    this.level = 0;
    this.pendingLasers = new Set();

    window.addEventListener("game:endFire", (event) => {
      if (!this.pendingLasers.delete(event.detail?.id)) return;
      if (this.pendingLasers.size > 0) return;

      this.level++;
      this.generateListid();
      this.fire();
    });
  }
  setLaserToFire(CanonLaserId) {
    this.laserToFire = CanonLaserId;
  }

  generateListid() {
    const count = Math.min(3 + this.level, 7);
    const availableIds = Array.from({ length: 10 }, (_, id) => id);
    const groupCounts = [0, 0];
    this.laserToFire = [];

    while (this.laserToFire.length < count) {
      const index = Math.floor(Math.random() * availableIds.length);
      const [id] = availableIds.splice(index, 1);
      const group = id < 5 ? 0 : 1;

      // Ne jamais selectionner les cinq canons d'un meme groupe.
      if (groupCounts[group] === 4) continue;

      this.laserToFire.push(id);
      groupCounts[group]++;
    }
  }

  fire = () => {
    if (this.pendingLasers.size > 0) return;
    this.generateListid();
    this.pendingLasers = new Set(this.laserToFire);

    window.dispatchEvent(
      new CustomEvent("game:fire", {
        detail: { id: [this.laserToFire] },
      }),
    );
  };

  hit = () => {
    window.dispatchEvent(new CustomEvent("game:hit", {}));
  };
}
