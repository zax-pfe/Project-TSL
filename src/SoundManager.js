import { Howl } from "howler";

export default class SoundManager {
  constructor() {
    // this.loop = loop;
    this.soundLight = new Howl({ src: ["./Sounds/soundLight-16bit.wav"], volume: 0.2 });
    this.soundLaser = new Howl({ src: ["./Sounds/soundLaser-16bit.wav"], volume: 0.4 });

    window.addEventListener("game:fire", () => {
      console.log("play sound");
      this.soundLight.play();
    });
    window.addEventListener("game:laser", () => {
      this.soundLight.stop();
      this.soundLaser.play();
    });

    window.addEventListener("game:endFire", () => {
      this.soundLight.stop();
      this.soundLaser.stop();
    });
  }
}
