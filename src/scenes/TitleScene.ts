import Phaser from "phaser";
import { IMAGE_ASSETS, SOUND_ASSETS } from "../assets/AssetManifest";
import { balanceConfig } from "../config/balanceConfig";
import { AssetLoader } from "../systems/AssetLoader";
import { SoundSystem } from "../systems/SoundSystem";

export class TitleScene extends Phaser.Scene {
  private soundSystem!: SoundSystem;

  constructor() {
    super("TitleScene");
  }

  preload(): void {
    AssetLoader.preload(this);
  }

  create(): void {
    this.soundSystem = new SoundSystem(this);
    this.soundSystem.playBgm(SOUND_ASSETS.BGM_TITLE.key);
    this.createBackdrop();

    this.add
      .text(balanceConfig.world.width / 2, 710, "TOUCH TO START", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fff8df",
        stroke: "#1d1720",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => this.scene.start("MainMenuScene"));
  }

  private createBackdrop(): void {
    if (this.textures.exists(IMAGE_ASSETS.TITLE_BACKGROUND.key)) {
      this.add
        .image(balanceConfig.world.width / 2, balanceConfig.world.height / 2, IMAGE_ASSETS.TITLE_BACKGROUND.key)
        .setDisplaySize(balanceConfig.world.width, balanceConfig.world.height);
      return;
    }

    this.add.rectangle(
      balanceConfig.world.width / 2,
      balanceConfig.world.height / 2,
      balanceConfig.world.width,
      balanceConfig.world.height,
      0x07080d,
      1,
    );
  }
}
