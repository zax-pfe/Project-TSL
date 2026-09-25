import { Howl } from "howler";

export default class SoundManager {
  constructor() {
    // this.loop = loop;

    this.eventLaserReceived = false;
    this.eventFireReceived = false;
    this.eventEndFireReceived = false;

    this.soundLight = new Howl({ src: ["./Sounds/soundLight.wav"], volume: 0.2 });
    this.soundLaser = new Howl({ src: ["./Sounds/soundLaser.wav"], volume: 0.4 });
    this.soundBurn = new Howl({ src: ["./Sounds/soundBurn.wav"], volume: 0.6 });
    this.regenerate = new Howl({ src: ["./Sounds/Regenerate.wav"], volume: 0.6 });

    this.soundWalk = new Howl({
      src: ["./Sounds/FootStepMetal.wav"],
      loop: true,
      volume: 0.1,
      rate: 1.7,
    });
    this.soundLoop = new Howl({
      src: ["./Sounds/soundLoop.wav"],
      loop: true,
      volume: 0.2,
    });

    this.soundLoop.play();

    window.addEventListener("game:fire", () => {
      if (this.eventFireReceived) return;
      if (this.laserEventReceived) console.log("play sound");
      this.soundLight.play();
      this.eventFireReceived = true;
      this.eventEndFireReceived = false;
    });
    window.addEventListener("game:laser", () => {
      if (this.eventLaserReceived) return;

      this.soundLight.stop();
      this.soundLaser.play();
      // this.soundLaser.play();
      this.eventLaserReceived = true;
    });

    window.addEventListener("game:endFire", () => {
      if (this.eventEndFireReceived) return;
      this.soundLight.stop();
      this.soundLaser.stop();
      this.eventEndFireReceived = true;
      this.eventLaserReceived = false;
      this.eventFireReceived = false;
    });

    window.addEventListener("game:hit", () => {
      this.soundBurn.play();
    });

    window.addEventListener("game:walking", () => {
      // console.log
      this.soundWalk.stop();
      this.soundWalk.fade(0, 0.1, 0.2);

      // this.soundWalk.volume = Math.random() * 0.1 + 0.05 - 0.05;
      this.soundWalk.play();
    });

    window.addEventListener("game:stopWalking", () => {
      this.soundWalk.fade(0.2, 0, 0.2);
    });

    window.addEventListener("game:hit", () => {
      this.soundWalk.stop();
    });

    window.addEventListener("game:restart", () => {
      this.regenerate.play();
    });
  }
}
