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
      .text(balanceConfig.world.width / 2, 84, data.result === "clear" ? "CLEAR" : "GAME OVER", {
        fontFamily: "monospace",
        fontSize: "34px",
        color: data.result === "clear" ? "#cdf4ff" : "#ffb8a8",
        stroke: "#331615",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 132, `${data.stageName} / ${data.mode.toUpperCase()}`, {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#f4efe2",
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 166, `Score ${data.score}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fff1a8",
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 196, `Gold +${data.gold}`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffd35a",
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 226, `Best Score ${data.bestScore}`, {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#f4efe2",
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 256, `Wave ${data.wave}  Combo ${data.highestCombo}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cdf4ff",
      })
      .setOrigin(0.5);

    this.add
      .text(balanceConfig.world.width / 2, 284, `Best Combo ${data.bestCombo}`, {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#f4efe2",
      })
      .setOrigin(0.5);

    this.add
      .text(54, 330, "Unlock", {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#fff1a8",
      })
      .setOrigin(0, 0.5);

    const unlockLines = data.unlockMessages.length > 0 ? data.unlockMessages : ["No new unlocks"];
    unlockLines.slice(0, 3).forEach((line, index) => {
      this.add
        .text(54, 360 + index * 24, line, {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#f4efe2",
        })
        .setOrigin(0, 0.5);
    });

    this.add
      .text(54, 448, "Upgrades", {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#cdf4ff",
      })
      .setOrigin(0, 0.5);

    const upgradeLines = data.upgrades.length > 0 ? data.upgrades : ["No upgrades selected"];

    upgradeLines.slice(0, 12).forEach((line, index) => {
      this.add
        .text(54, 480 + index * 20, line, {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#f4efe2",
        })
        .setOrigin(0, 0.5);
    });

    const lobbyButton = this.add
      .rectangle(balanceConfig.world.width / 2, 746, 174, 54, 0x2e6658, 0.96)
      .setStrokeStyle(2, 0xf4efe2, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(balanceConfig.world.width / 2, 746, "Lobby", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    lobbyButton.on("pointerdown", () => this.scene.start("LobbyScene"));
  }
}
