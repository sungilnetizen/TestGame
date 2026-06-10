import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { IMAGE_ASSETS } from "../assets/AssetManifest";

export class EffectSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  createBackdrop(): void {
    if (this.scene.textures.exists(IMAGE_ASSETS.BACKGROUND_STAGE_01.key)) {
      this.scene.add
        .image(195, 422, IMAGE_ASSETS.BACKGROUND_STAGE_01.key)
        .setDisplaySize(390, 844);
    } else {
      this.scene.add.rectangle(195, 422, 390, 844, 0x0b0a10);
    }

    this.scene.add.rectangle(195, balanceConfig.world.defenseLineY + 4, 390, 6, 0xc94d4d, 0.85);
    this.scene.add.text(16, balanceConfig.world.defenseLineY + 12, "DEFENSE LINE", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#d6b8a2",
    });

    for (let i = 0; i < 40; i += 1) {
      this.scene.add.rectangle(
        Phaser.Math.Between(8, 382),
        Phaser.Math.Between(95, 690),
        2,
        Phaser.Math.Between(2, 5),
        0x6f5c82,
        Phaser.Math.FloatBetween(0.25, 0.7),
      );
    }
  }

  createBurstEffect(x: number, y: number): void {
    if (this.scene.textures.exists(IMAGE_ASSETS.BURST_EFFECT.key)) {
      const effectImage = this.scene.add
        .image(x, y, IMAGE_ASSETS.BURST_EFFECT.key)
        .setDisplaySize(160, 160)
        .setDepth(800);
      this.scene.tweens.add({
        targets: effectImage,
        alpha: 0,
        scaleX: 4.6,
        scaleY: 4.6,
        duration: balanceConfig.burst.effectDuration,
        ease: "Quad.easeOut",
        onComplete: () => effectImage.destroy(),
      });
    }

    const effect = this.scene.add.graphics({ x, y });
    effect.fillStyle(0x9ad7ff, 0.18);
    effect.lineStyle(5, 0xcdf4ff, 0.86);
    effect.fillCircle(0, 0, 80);
    effect.strokeCircle(0, 0, 80);
    effect.setDepth(800);

    const wave = this.scene.add.circle(x, y, 28, 0xffffff, 0).setStrokeStyle(4, 0xf3d88b, 0.9);
    wave.setDepth(801);

    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 4.6,
      scaleY: 4.6,
      duration: balanceConfig.burst.effectDuration,
      ease: "Quad.easeOut",
      onComplete: () => effect.destroy(),
    });

    this.scene.tweens.add({
      targets: wave,
      alpha: 0,
      scaleX: 8,
      scaleY: 8,
      duration: balanceConfig.burst.effectDuration + 120,
      ease: "Sine.easeOut",
      onComplete: () => wave.destroy(),
    });
  }

  createWaveAdvanceEffect(waveNumber: number): void {
    const waveText = this.scene.add
      .text(balanceConfig.world.width / 2, 124, `Wave ${waveNumber}`, {
        fontFamily: "monospace",
        fontSize: "34px",
        color: "#cdf4ff",
        stroke: "#172433",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setScale(0.7);

    this.scene.tweens.add({
      targets: waveText,
      alpha: 0,
      y: 96,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 850,
      ease: "Back.easeOut",
      onComplete: () => waveText.destroy(),
    });
  }

  createMonsterDefeatEffect(x: number, y: number): void {
    if (this.scene.textures.exists(IMAGE_ASSETS.KILL_BURST.key)) {
      const killImage = this.scene.add
        .image(x, y, IMAGE_ASSETS.KILL_BURST.key)
        .setDisplaySize(56, 56)
        .setDepth(620);
      this.scene.tweens.add({
        targets: killImage,
        alpha: 0,
        scaleX: 1.8,
        scaleY: 1.8,
        duration: 220,
        ease: "Quad.easeOut",
        onComplete: () => killImage.destroy(),
      });
      return;
    }

    const burst = this.scene.add.graphics({ x, y }).setDepth(620);
    burst.fillStyle(0xf4e36f, 0.38);
    burst.fillCircle(0, 0, 28);

    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 220,
      ease: "Quad.easeOut",
      onComplete: () => burst.destroy(),
    });

    for (let i = 0; i < 7; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(18, 44);
      const shard = this.scene.add
        .rectangle(x, y, Phaser.Math.Between(3, 6), Phaser.Math.Between(6, 12), 0xd8a7ff, 0.92)
        .setRotation(angle)
        .setDepth(621);

      this.scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        rotation: angle + Phaser.Math.FloatBetween(-1.8, 1.8),
        duration: Phaser.Math.Between(260, 420),
        ease: "Quad.easeOut",
        onComplete: () => shard.destroy(),
      });
    }
  }

  showDamageNumber(x: number, y: number, damage: number, color = "#fff1a8", isCritical = false): void {
    const damageText = this.scene.add
      .text(x, y, `${damage}`, {
        fontFamily: "monospace",
        fontSize: isCritical ? "42px" : "30px",
        color: isCritical ? "#ff4d43" : color,
        stroke: isCritical ? "#4a1612" : "#37221d",
        strokeThickness: isCritical ? 6 : 4,
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: damageText,
      y: y - 28,
      alpha: 0,
      duration: 520,
      ease: "Quad.easeOut",
      onComplete: () => damageText.destroy(),
    });
  }
}
