import Phaser from "phaser";
import { ControlAction } from "../types/GameTypes";
import { IMAGE_ASSETS } from "../assets/AssetManifest";

type ControlCallback = (action: ControlAction) => void;
type ButtonVisual = Phaser.GameObjects.Arc | Phaser.GameObjects.Image;

type TouchButton = {
  hitArea: Phaser.GameObjects.Arc;
  visual: ButtonVisual;
  revealVisual?: Phaser.GameObjects.Image;
  revealMask?: Phaser.GameObjects.Graphics;
};

export class TouchControls {
  private readonly scene: Phaser.Scene;
  private readonly burstButton: TouchButton;
  private readonly burstCooldownFill: Phaser.GameObjects.Graphics;
  private readonly burstReadyFlash: Phaser.GameObjects.Arc;
  private readonly burstColor = 0x59428e;
  private readonly burstDimColor = 0x3a3150;
  private readonly burstX = 200;
  private readonly burstY = 748;
  private readonly buttonRadius = 43;
  private wasBurstCoolingDown = false;

  constructor(scene: Phaser.Scene, onPress: ControlCallback) {
    this.scene = scene;
    this.createButton(scene, 80, 748, this.buttonRadius, 0x2e6658, IMAGE_ASSETS.BUTTON_TOUCH_JUMP.key, () => onPress("jump"));
    const burstControl = this.createButton(
      scene,
      this.burstX,
      this.burstY,
      this.buttonRadius,
      this.burstColor,
      IMAGE_ASSETS.BUTTON_TOUCH_BURST.key,
      () => onPress("burst"),
    );
    this.createButton(scene, 320, 748, this.buttonRadius, 0x9d3b3b, IMAGE_ASSETS.BUTTON_TOUCH_ATTACK.key, () => onPress("attack"));

    this.burstButton = burstControl;
    this.burstCooldownFill = scene.add.graphics().setDepth(4);
    this.burstReadyFlash = scene.add
      .circle(this.burstX, this.burstY, this.buttonRadius + 4, 0xfff1a8, 0)
      .setStrokeStyle(3, 0xfff1a8, 0)
      .setDepth(5);
  }

  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number,
    assetKey: string,
    callback: () => void,
  ): TouchButton {
    const button = this.createButtonBody(scene, x, y, radius, color, assetKey);
    const diameter = radius * 2;

    button.hitArea.on("pointerdown", () => {
      this.setButtonPressed(button, diameter);
      callback();
    });
    button.hitArea.on("pointerup", () => this.setButtonResting(button, diameter));
    button.hitArea.on("pointerout", () => this.setButtonResting(button, diameter));

    return button;
  }

  private setButtonPressed(button: TouchButton, diameter: number): void {
    button.hitArea.setScale(0.96);

    if (button.visual instanceof Phaser.GameObjects.Image) {
      button.visual.setDisplaySize(diameter * 0.96, diameter * 0.96);
      button.revealVisual?.setDisplaySize(diameter * 0.96, diameter * 0.96);
      return;
    }

    button.visual.setScale(0.96);
  }

  private setButtonResting(button: TouchButton, diameter: number): void {
    button.hitArea.setScale(1);

    if (button.visual instanceof Phaser.GameObjects.Image) {
      button.visual.setDisplaySize(diameter, diameter);
      button.revealVisual?.setDisplaySize(diameter, diameter);
      return;
    }

    button.visual.setScale(1);
  }

  private createButtonBody(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number,
    assetKey: string,
  ): TouchButton {
    const hitArea = scene.add
      .circle(x, y, radius, color, 0.16)
      .setStrokeStyle(3, 0xf4efe2, 0.42)
      .setInteractive({ useHandCursor: true })
      .setDepth(3);

    if (scene.textures.exists(assetKey)) {
      const visual = scene.add
        .image(x, y, assetKey)
        .setDisplaySize(radius * 2, radius * 2)
        .setDepth(4);
      const revealVisual = scene.add
        .image(x, y, assetKey)
        .setDisplaySize(radius * 2, radius * 2)
        .setDepth(5)
        .setVisible(false);
      const revealMask = scene.make.graphics({ x: 0, y: 0 }, false);
      revealVisual.setMask(revealMask.createGeometryMask());
      return { hitArea, visual, revealVisual, revealMask };
    }

    const visual = scene.add
      .circle(x, y, radius, color, 0.34)
      .setStrokeStyle(3, 0xf4efe2, 0.52)
      .setDepth(4);
    return { hitArea, visual };
  }

  setBurstCooldown(remainingMs: number, cooldownMs: number): void {
    if (remainingMs <= 0) {
      this.burstButton.hitArea.setFillStyle(this.burstColor, 0.16);
      this.setBurstVisualReady();
      this.burstCooldownFill.clear();
      if (this.wasBurstCoolingDown) {
        this.flashBurstReady();
      }
      this.wasBurstCoolingDown = false;
      return;
    }

    const readyRate = Phaser.Math.Clamp(1 - remainingMs / cooldownMs, 0, 1);

    this.wasBurstCoolingDown = true;
    this.burstButton.hitArea.setFillStyle(this.burstDimColor, 0.16);
    this.setBurstVisualCoolingDown();
    this.burstCooldownFill.clear();
    this.drawBurstReveal(readyRate);
    if (this.burstButton.revealVisual) return;

    const endAngle = -90 + readyRate * 360;
    this.burstCooldownFill.fillStyle(this.burstColor, 0.76);
    this.burstCooldownFill.slice(
      this.burstX,
      this.burstY,
      this.buttonRadius,
      Phaser.Math.DegToRad(-90),
      Phaser.Math.DegToRad(endAngle),
      false,
    );
    this.burstCooldownFill.lineTo(this.burstX, this.burstY);
    this.burstCooldownFill.closePath();
    this.burstCooldownFill.fillPath();
  }

  private setBurstVisualCoolingDown(): void {
    if (this.burstButton.visual instanceof Phaser.GameObjects.Image) {
      this.burstButton.visual.setAlpha(0.38).setTint(0x5a5268);
      this.burstButton.revealVisual?.clearTint().setAlpha(1).setVisible(true);
      return;
    }

    this.burstButton.visual.setAlpha(0.42);
  }

  private setBurstVisualReady(): void {
    if (this.burstButton.visual instanceof Phaser.GameObjects.Image) {
      this.burstButton.visual.clearTint().setAlpha(1);
      this.burstButton.revealVisual?.setVisible(false);
      this.burstButton.revealMask?.clear();
      return;
    }

    this.burstButton.visual.setAlpha(1);
  }

  private flashBurstReady(): void {
    this.burstReadyFlash.setAlpha(0.72).setScale(0.82);
    this.scene.tweens.killTweensOf(this.burstReadyFlash);
    this.scene.tweens.add({
      targets: this.burstReadyFlash,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 360,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this.burstButton.revealVisual ?? this.burstButton.visual,
      alpha: { from: 0.68, to: 1 },
      duration: 180,
      ease: "Sine.easeOut",
    });
  }

  private drawBurstReveal(readyRate: number): void {
    if (!this.burstButton.revealVisual || !this.burstButton.revealMask) return;

    const mask = this.burstButton.revealMask;
    const endAngle = -90 + readyRate * 360;
    mask.clear();

    if (readyRate <= 0) return;

    mask.fillStyle(0xffffff, 1);
    mask.slice(
      this.burstX,
      this.burstY,
      this.buttonRadius,
      Phaser.Math.DegToRad(-90),
      Phaser.Math.DegToRad(endAngle),
      false,
    );
    mask.lineTo(this.burstX, this.burstY);
    mask.closePath();
    mask.fillPath();
  }
}
