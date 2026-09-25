import EventEmitter from "./Utils/EventEmitter";

export default class GameManager extends EventEmitter {
  constructor() {
    super();
    console.log("GameManager");
    this.level = 0;
    this.pendingLasers = new Set();
    this.delayRounds = 1;

    window.addEventListener("game:endFire", (event) => {
      if (!this.pendingLasers.delete(event.detail?.id)) return;
      if (this.pendingLasers.size > 0) return;

      this.level++;
      this.delayRounds -= 0.1;
      this.delayEvent(this.delayRounds, this.fire);
      // this.fire();
    });
  }
  setLaserToFire(CanonLaserId) {
    this.laserToFire = CanonLaserId;
  }

  generateListid() {
    const count = 4 + Math.floor(Math.random() * 4);
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

  // duration en secondes. Retourne l'identifiant pour permettre clearTimeout(id).
  delayEvent(duration, callBack) {
    return setTimeout(callBack, duration * 1000);
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
