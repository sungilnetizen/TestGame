import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { IMAGE_ASSETS } from "../assets/AssetManifest";
import { CollisionSystem } from "./CollisionSystem";

export class EffectSystem {
  private background?: Phaser.GameObjects.Image;
  private defenseLine?: Phaser.GameObjects.Rectangle;
  private defenseLineZone?: Phaser.GameObjects.Rectangle;
  private backgroundBaseY = balanceConfig.world.height / 2;
  private backgroundTargetY = balanceConfig.world.height / 2;

  constructor(private readonly scene: Phaser.Scene) {}

  createBackdrop(): void {
    if (this.scene.textures.exists(IMAGE_ASSETS.BACKGROUND_STAGE_01.key)) {
      this.background = this.scene.add.image(
        balanceConfig.world.width / 2,
        balanceConfig.world.height / 2,
        IMAGE_ASSETS.BACKGROUND_STAGE_01.key,
      );
      this.fitTallBackground();
    } else {
      this.scene.add.rectangle(195, 422, 390, 844, 0x0b0a10);
    }

    const defenseLineY = CollisionSystem.getDefenseLineY();
    this.defenseLine = this.scene.add.rectangle(
      balanceConfig.world.width / 2,
      defenseLineY,
      balanceConfig.world.width,
      4,
      0xff3d3d,
      0.86,
    ).setDepth(120);
    this.defenseLineZone = this.scene.add.rectangle(
      balanceConfig.world.width / 2,
      defenseLineY - 10,
      balanceConfig.world.width,
      20,
      0xff3d3d,
      0.08,
    ).setDepth(119);

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

  updateBackdropForPlayer(playerY: number, deltaMs: number, isPlayerGrounded: boolean): void {
    if (!this.background) return;

    if (isPlayerGrounded) {
      this.backgroundTargetY = this.backgroundBaseY;
      if (Math.abs(this.background.y - this.backgroundBaseY) < 1.5) {
        this.background.y = this.backgroundBaseY;
      }
      this.updateDefenseLinePosition();
      return;
    }

    const jumpHeight = Phaser.Math.Clamp(balanceConfig.player.startY - playerY, 0, 260);
    const maxPan = Math.max(0, this.background.displayHeight - balanceConfig.world.height);
    const targetOffset = Math.min(maxPan, 28, jumpHeight * 0.1);
    this.backgroundTargetY = this.backgroundBaseY + targetOffset;

    const smoothing = 1 - Math.pow(0.002, deltaMs / 1000);
    this.background.y = Phaser.Math.Linear(this.background.y, this.backgroundTargetY, smoothing);
    this.updateDefenseLinePosition();
  }

  getDefenseLineY(): number {
    return CollisionSystem.getDefenseLineY() + this.getBackdropOffsetY();
  }

  setDebugVisible(visible: boolean): void {
    this.defenseLine?.setVisible(visible);
    this.defenseLineZone?.setVisible(visible);
  }

  private fitTallBackground(): void {
    if (!this.background) return;

    const source = this.background.texture.getSourceImage() as HTMLImageElement;
    const sourceWidth = source.width || balanceConfig.world.width;
    const sourceHeight = source.height || balanceConfig.world.height;
    const minPanSpace = 80;
    const scale = Math.max(
      balanceConfig.world.width / sourceWidth,
      (balanceConfig.world.height + minPanSpace) / sourceHeight,
    );
    const displayWidth = sourceWidth * scale;
    const displayHeight = sourceHeight * scale;

    this.background.setDisplaySize(displayWidth, displayHeight);
    this.backgroundBaseY = balanceConfig.world.height - displayHeight / 2;
    this.backgroundTargetY = this.backgroundBaseY;
    this.background.setPosition(balanceConfig.world.width / 2, this.backgroundBaseY);
  }

  private getBackdropOffsetY(): number {
    if (!this.background) return 0;

    return this.background.y - this.backgroundBaseY;
  }

  private updateDefenseLinePosition(): void {
    const defenseLineY = this.getDefenseLineY();
    this.defenseLine?.setY(defenseLineY);
    this.defenseLineZone?.setY(defenseLineY - 10);
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

  createMonsterDefeatEffect(x: number, y: number, monsterRadius = 28): void {
    this.createSlashMarkEffect(x, y, monsterRadius);

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

  private createSlashMarkEffect(x: number, y: number, monsterRadius: number): void {
    if (!this.scene.textures.exists(IMAGE_ASSETS.SLASH_MARK.key)) return;

    const size = monsterRadius * balanceConfig.effects.slashMarkSizeMultiplier;
    const slashMark = this.scene.add
      .image(x, y, IMAGE_ASSETS.SLASH_MARK.key)
      .setDisplaySize(size, size)
      .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2))
      .setAlpha(0.96)
      .setDepth(630);
    const targetScaleX = slashMark.scaleX * balanceConfig.effects.slashMarkScaleOutMultiplier;
    const targetScaleY = slashMark.scaleY * balanceConfig.effects.slashMarkScaleOutMultiplier;

    this.scene.tweens.add({
      targets: slashMark,
      alpha: 0,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: balanceConfig.effects.slashMarkDuration,
      ease: "Sine.easeOut",
      onComplete: () => slashMark.destroy(),
    });
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
