import { Howl } from "howler";

export default class SoundManager {
  constructor() {
    // this.loop = loop;
    this.soundLight = new Howl({ src: ["./Sounds/soundLight.wav"], volume: 0.2 });
    this.soundLaser = new Howl({ src: ["./Sounds/soundLaser.wav"], volume: 0.4 });
    this.soundBurn = new Howl({ src: ["./Sounds/soundBurn.wav"], volume: 0.6 });

    window.addEventListener("game:fire", () => {
      console.log("play sound");
      this.soundLight.play();
    });
    window.addEventListener("game:laser", () => {
      this.soundLight.stop();
      this.soundLaser.play();
      // this.soundLaser.play();
    });

    window.addEventListener("game:endFire", () => {
      this.soundLight.stop();
      this.soundLaser.stop();
    });

    window.addEventListener("game:hit", () => {
      this.soundBurn.play();
    });
  }
}
