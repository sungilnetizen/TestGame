import Phaser from "phaser";
import { ControlAction } from "../types/GameTypes";

type ControlCallback = (action: ControlAction) => void;

export class TouchControls {
  private readonly burstButton: Phaser.GameObjects.Rectangle;
  private readonly burstCooldownFill: Phaser.GameObjects.Graphics;
  private readonly burstText: Phaser.GameObjects.Text;
  private readonly burstColor = 0x59428e;
  private readonly burstDimColor = 0x3a3150;
  private readonly burstX = 320;
  private readonly burstY = 705;
  private readonly burstRadius = 31;

  constructor(scene: Phaser.Scene, onPress: ControlCallback) {
    this.createButton(scene, 75, 790, 96, 62, "Jump", 0x2e6658, () => onPress("jump"));
    this.createButton(scene, 320, 790, 118, 72, "Attack", 0x9d3b3b, () => onPress("attack"));
    const burstControl = this.createButton(
      scene,
      this.burstX,
      this.burstY,
      96,
      62,
      "Burst",
      this.burstColor,
      () => onPress("burst"),
    );

    this.burstButton = burstControl.button;
    this.burstText = burstControl.text;
    this.burstCooldownFill = scene.add.graphics().setDepth(4);
  }

  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    callback: () => void,
  ): { button: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const button = scene.add
      .rectangle(x, y, width, height, color, 0.92)
      .setStrokeStyle(2, 0xf4efe2, 0.75)
      .setInteractive({ useHandCursor: true })
      .setDepth(3);
    const text = scene.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: label === "Attack" ? "19px" : "15px",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    button.on("pointerdown", () => {
      button.setScale(0.96);
      callback();
    });
    button.on("pointerup", () => button.setScale(1));
    button.on("pointerout", () => button.setScale(1));
    text.setDepth(5);

    return { button, text };
  }

  setBurstCooldown(remainingMs: number, cooldownMs: number): void {
    if (remainingMs <= 0) {
      this.burstButton.setFillStyle(this.burstColor, 0.92);
      this.burstText.setAlpha(1);
      this.burstCooldownFill.clear();
      return;
    }

    const readyRate = Phaser.Math.Clamp(1 - remainingMs / cooldownMs, 0, 1);
    const endAngle = -90 + readyRate * 360;

    this.burstButton.setFillStyle(this.burstDimColor, 0.72);
    this.burstText.setAlpha(0.72);
    this.burstCooldownFill.clear();
    this.burstCooldownFill.fillStyle(this.burstColor, 0.92);
    this.burstCooldownFill.slice(
      this.burstX,
      this.burstY,
      this.burstRadius,
      Phaser.Math.DegToRad(-90),
      Phaser.Math.DegToRad(endAngle),
      false,
    );
    this.burstCooldownFill.lineTo(this.burstX, this.burstY);
    this.burstCooldownFill.closePath();
    this.burstCooldownFill.fillPath();
  }
}
