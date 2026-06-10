import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { GameOverData } from "../types/GameTypes";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data: GameOverData): void {
    this.add.rectangle(
      balanceConfig.world.width / 2,
      balanceConfig.world.height / 2,
      balanceConfig.world.width,
      balanceConfig.world.height,
      0x050507,
      1,
    );

    this.add
      .text(balanceConfig.world.width / 2, 92, "Game Over", {
        fontFamily: "monospace",
        fontSize: "34px",
        color: "#ffb8a8",
        stroke: "#331615",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 148, `Score ${data.score}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fff1a8",
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 178, `Best Score ${data.bestScore}`, {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#f4efe2",
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 212, `Wave ${data.wave}  Combo ${data.highestCombo}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cdf4ff",
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 240, `Best Combo ${data.bestCombo}`, {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#f4efe2",
      })
      .setOrigin(0.5);

    this.add
      .text(54, 294, "Upgrades", {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#cdf4ff",
      })
      .setOrigin(0, 0.5);

    const upgradeLines = data.upgrades.length > 0 ? data.upgrades : ["No upgrades selected"];

    upgradeLines.slice(0, 12).forEach((line, index) => {
      this.add
        .text(54, 326 + index * 26, line, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#f4efe2",
        })
        .setOrigin(0, 0.5);
    });

    const restartButton = this.add
      .rectangle(balanceConfig.world.width / 2, 746, 174, 54, 0x2e6658, 0.96)
      .setStrokeStyle(2, 0xf4efe2, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(balanceConfig.world.width / 2, 746, "Restart", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    restartButton.on("pointerdown", () => this.scene.start("GameScene", { autoStart: true }));
  }
}
