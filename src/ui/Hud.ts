import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";

export class Hud {
  private readonly waveText: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly lifeText: Phaser.GameObjects.Text;
  private readonly burstText: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;
  private comboFadeTween?: Phaser.Tweens.Tween;
  private comboPopTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#f4efe2",
    };

    this.waveText = scene.add.text(16, 16, "Wave 1", style);
    this.scoreText = scene.add.text(16, 39, "Score 0", style);
    this.comboText = scene.add
      .text(balanceConfig.world.width / 2, 210, "Combo 0", {
        ...style,
        fontSize: "28px",
        color: "#fff1a8",
        stroke: "#37221d",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setAlpha(0)
      .setScale(0.7)
      .setDepth(1000);
    this.lifeText = scene.add.text(155, 39, `Life ${balanceConfig.run.startingLife}`, style);
    this.burstText = scene.add.text(276, 16, "Burst Ready", {
      ...style,
      fontSize: "13px",
      color: "#f3d88b",
    }).setAlpha(0);
  }

  setLife(life: number): void {
    this.lifeText.setText(`Life ${life}`);
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

    this.comboText.setText(`Combo ${combo}`);
    this.comboFadeTween?.stop();
    this.comboPopTween?.stop();
    this.comboText.setAlpha(1).setDepth(1000);
    this.comboPopTween = this.scene.tweens.add({
      targets: this.comboText,
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
      targets: this.comboText,
      alpha: 0,
      scaleX: 0.78,
      scaleY: 0.78,
      duration: 650,
      ease: "Sine.easeOut",
    });
  }
}
