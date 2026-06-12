import Phaser from "phaser";
import { IMAGE_ASSETS, SOUND_ASSETS } from "../assets/AssetManifest";
import { balanceConfig } from "../config/balanceConfig";
import { RunRecordSystem } from "../systems/RunRecordSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { SoundSystem } from "../systems/SoundSystem";
import type { GameDifficulty } from "../types/GameRunTypes";

type ButtonBody = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;

export class MainMenuScene extends Phaser.Scene {
  private soundSystem!: SoundSystem;
  private settingsPanel?: Phaser.GameObjects.Container;
  private selectedDifficulty: GameDifficulty = "normal";
  private difficultyText?: Phaser.GameObjects.Text;

  constructor() {
    super("MainMenuScene");
  }

  create(): void {
    this.soundSystem = new SoundSystem(this);
    const saveData = SaveSystem.load();
    const records = new RunRecordSystem().getRecords();

    this.createBackdrop();
    this.add
      .text(balanceConfig.world.width / 2, 168, `Best Score ${records.bestScore}\nBest Combo ${records.bestCombo}`, {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#cdf4ff",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.difficultyText = this.add
      .text(195, 292, `DIFFICULTY ${this.selectedDifficulty.toUpperCase()}`, {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#fff1a8",
        stroke: "#31201c",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.difficultyText.on("pointerdown", () => this.changeDifficulty());

    this.createButton(195, 352, "NEW GAME", 0x2e6658, () => {
      this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
      this.scene.start("LobbyScene", { difficulty: this.selectedDifficulty, selectedStageId: 1 });
    });
    this.createButton(195, 426, "CONTINUE", 0x59428e, () => {
      this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
      this.scene.start("LobbyScene", { difficulty: this.selectedDifficulty, selectedStageId: saveData.selectedStageId });
    });
    this.createButton(195, 500, "SETTING", 0x38475c, () => this.showSettingsPanel());
  }

  private changeDifficulty(): void {
    const order: GameDifficulty[] = ["easy", "normal", "hard"];
    const nextIndex = (order.indexOf(this.selectedDifficulty) + 1) % order.length;
    this.selectedDifficulty = order[nextIndex];
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.difficultyText?.setText(`DIFFICULTY ${this.selectedDifficulty.toUpperCase()}`);
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

  private createButton(x: number, y: number, label: string, color: number, callback: () => void): void {
    const button = this.createButtonBody(x, y, 220, 56, color);
    const text = this.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    button.on("pointerdown", callback);
    text.setDepth(button.depth + 1);
  }

  private createButtonBody(x: number, y: number, width: number, height: number, color: number): ButtonBody {
    if (this.textures.exists(IMAGE_ASSETS.BUTTON_PRIMARY.key)) {
      return this.add
        .image(x, y, IMAGE_ASSETS.BUTTON_PRIMARY.key)
        .setDisplaySize(width, height)
        .setInteractive({ useHandCursor: true });
    }

    return this.add
      .rectangle(x, y, width, height, color, 0.96)
      .setStrokeStyle(2, 0xf4efe2, 0.82)
      .setInteractive({ useHandCursor: true });
  }

  private showSettingsPanel(): void {
    this.settingsPanel?.destroy();
    const panel = this.add.container(0, 0).setDepth(1000);
    this.settingsPanel = panel;
    const dim = this.add.rectangle(195, 422, 390, 844, 0x000000, 0.48).setInteractive();
    const box = this.add.rectangle(195, 408, 282, 214, 0x111722, 0.96).setStrokeStyle(3, 0xf4efe2, 0.72);
    const title = this.add
      .text(195, 338, "SETTING", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#fff1a8",
        stroke: "#31201c",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const sound = this.add
      .text(195, 408, this.soundSystem.isEnabled() ? "SOUND ON" : "SOUND OFF", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff8df",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    sound.on("pointerdown", () => sound.setText(this.soundSystem.toggle() ? "SOUND ON" : "SOUND OFF"));
    const close = this.add
      .text(195, 478, "CLOSE", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#cdf4ff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    close.on("pointerdown", () => {
      this.settingsPanel?.destroy();
      this.settingsPanel = undefined;
    });

    panel.add([dim, box, title, sound, close]);
  }
}
