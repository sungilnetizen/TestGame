import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";

export class Hud {
  private readonly waveText: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly comboContainer: Phaser.GameObjects.Container;
  private readonly comboNumberText: Phaser.GameObjects.Text;
  private readonly comboLabelText: Phaser.GameObjects.Text;
  private readonly lifeText: Phaser.GameObjects.Text;
  private readonly burstText: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;
  private comboFadeTween?: Phaser.Tweens.Tween;
  private comboPopTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#f4efe2",
      stroke: "#1d1720",
      strokeThickness: 3,
    };

    this.waveText = scene.add.text(16, 14, "Wave 1", style).setShadow(0, 2, "#100b10", 4, true, true).setDepth(1000);
    this.scoreText = scene.add.text(16, 40, "Score 0", style).setShadow(0, 2, "#100b10", 4, true, true).setDepth(1000);
    this.comboNumberText = scene.add
      .text(0, 0, "0", {
        ...style,
        fontSize: "34px",
        color: "#fff1a8",
        stroke: "#37221d",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
      .setShadow(0, 3, "#2d1b12", 5, true, true);
    this.comboLabelText = scene.add
      .text(0, 31, "COMBO", {
        ...style,
        fontSize: "18px",
        color: "#ffd35a",
        stroke: "#37221d",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setShadow(0, 2, "#2d1b12", 4, true, true);
    this.comboContainer = scene.add
      .container(346, 198, [this.comboNumberText, this.comboLabelText])
      .setAlpha(0)
      .setScale(0.7)
      .setDepth(1000);
    this.lifeText = scene.add.text(16, 66, this.createLifeLabel(balanceConfig.run.startingLife), {
      ...style,
      color: "#ff5a6f",
      stroke: "#351017",
      strokeThickness: 4,
    }).setShadow(0, 2, "#16080c", 4, true, true).setDepth(1000);
    this.burstText = scene.add.text(276, 16, "Burst Ready", {
      ...style,
      fontSize: "13px",
      color: "#f3d88b",
    }).setAlpha(0).setDepth(1000);
  }

  setLife(life: number): void {
    this.lifeText.setText(this.createLifeLabel(life));
  }

  setScore(score: number): void {
    this.scoreText.setText(`Score ${score}`);
  }

  setWave(wave: number): void {
    this.waveText.setText(`Wave ${wave}`);
  }

  setCombo(combo: number): void {
    if (combo <= 0) {
      this.fadeOutCombo();
      return;
    }

    this.comboNumberText.setText(`${combo}`);
    this.comboFadeTween?.stop();
    this.comboPopTween?.stop();
    this.comboContainer.setAlpha(1).setDepth(1000);
    this.comboPopTween = this.scene.tweens.add({
      targets: this.comboContainer,
      scaleX: { from: 1.38, to: 1 },
      scaleY: { from: 1.38, to: 1 },
      duration: 170,
      ease: "Back.easeOut",
    });
  }

  setBurstLabel(label: string): void {
    this.burstText.setText(label);
  }

  setBurstCooldown(remainingMs: number): void {
    if (remainingMs <= 0) {
      this.burstText.setText("Burst Ready");
      this.burstText.setColor("#f3d88b");
      return;
    }

    this.burstText.setText(`Burst ${Math.ceil(remainingMs / 1000)}s`);
    this.burstText.setColor("#a7a0b8");
  }

  private fadeOutCombo(): void {
    this.comboPopTween?.stop();
    this.comboFadeTween?.stop();
    this.comboFadeTween = this.scene.tweens.add({
      targets: this.comboContainer,
      alpha: 0,
      scaleX: 0.78,
      scaleY: 0.78,
      duration: 650,
      ease: "Sine.easeOut",
    });
  }

  private createLifeLabel(life: number): string {
    return Array.from({ length: Math.max(0, life) }, () => "♥").join(" ");
  }
}
