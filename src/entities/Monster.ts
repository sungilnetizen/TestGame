import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { enemyDefinitions, type EnemyType } from "../data/enemies";

type MonsterOptions = {
  hp?: number;
  fallSpeed?: number;
  type?: EnemyType;
  scoreValue?: number;
  textureKey?: string;
};

type DamageOptions = {
  impact?: boolean;
};

type FreezeOptions = {
  durationMs: number;
  tintColor?: number;
};

export class Monster extends Phaser.GameObjects.Container {
  readonly type: EnemyType;
  readonly radius: number;
  readonly scoreValue: number;
  private readonly core: Phaser.GameObjects.Shape;
  private readonly collisionDebugBox: Phaser.GameObjects.Rectangle;
  private readonly maxHp: number;
  private sprite?: Phaser.GameObjects.Image;
  private bossHpBar?: Phaser.GameObjects.Graphics;
  private bossHpBarWidth = 0;
  private bossHpBarHeight = 0;
  private bossHpBarY = 0;
  private readonly baseColor: number;
  private readonly fallSpeed: number;
  private hp: number = balanceConfig.monster.maxHp;
  private liftVelocity = 0;
  private slowMultiplier = 1;
  private slowDuration = 1;
  private slowedFrom = -Infinity;
  private slowedUntil = -Infinity;
  private frozenUntil = -Infinity;
  private destroyed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, options: MonsterOptions = {}) {
    super(scene, x, y);

    const monsterType = options.type ?? "normal";
    this.type = monsterType;
    this.setDepth(monsterType === "boss" ? 610 : 600);
    const typeConfig = enemyDefinitions[monsterType];
    this.radius = typeConfig.radius;
    this.scoreValue = options.scoreValue ?? typeConfig.scoreValue;
    this.baseColor = typeConfig.color;
    this.maxHp = options.hp ?? balanceConfig.monster.maxHp;
    this.hp = this.maxHp;
    this.fallSpeed =
      (options.fallSpeed ?? balanceConfig.monster.fallSpeed) +
      Phaser.Math.Between(balanceConfig.monster.fallSpeedRandomMin, balanceConfig.monster.fallSpeedRandomMax);
    this.core = this.createCore(scene, typeConfig.shape, typeConfig.color);
    this.collisionDebugBox = scene.add
      .rectangle(0, 0, this.radius * 2, this.radius * 2, 0xff3d3d, 0.06)
      .setStrokeStyle(2, 0xff3d3d, 0.38);
    const eye = scene.add.rectangle(0, -3, 18, 5, 0xf8f1ff);
    const requestedTextureKey = options.textureKey ?? typeConfig.assetKey;
    const textureKey = scene.textures.exists(requestedTextureKey) ? requestedTextureKey : typeConfig.assetKey;

    if (scene.textures.exists(textureKey)) {
      this.sprite = scene.add
        .image(0, 0, textureKey)
        .setDisplaySize(this.radius * 2, this.radius * 2);
      this.core.setVisible(false);
      eye.setVisible(false);
      this.add([this.sprite, this.core, eye, this.collisionDebugBox]);
    } else {
      this.add([this.core, eye, this.collisionDebugBox]);
    }

    if (this.type === "boss") {
      this.createBossHpBar(scene);
    }

    scene.add.existing(this);
  }

  updateMonster(deltaMs: number): void {
    if (this.destroyed) return;

    const dt = deltaMs / 1000;
    const now = this.scene.time.now;
    let speedMultiplier = 1;

    if (now < this.frozenUntil) {
      speedMultiplier = 0;
      this.setFreezeTint(0x5fb7ff);
    } else if (this.core.fillColor !== this.baseColor) {
      this.clearFreezeTint();
    }

    if (now < this.slowedUntil) {
      const slowProgress = Phaser.Math.Clamp(
        (now - this.slowedFrom) / this.slowDuration,
        0,
        1,
      );
      const easedProgress = slowProgress * slowProgress * (3 - 2 * slowProgress);
      speedMultiplier = Phaser.Math.Linear(
        this.slowMultiplier,
        1,
        easedProgress,
      );
    }

    this.y += (this.fallSpeed * speedMultiplier + this.liftVelocity) * dt;

    if (this.liftVelocity < 0) {
      this.liftVelocity = Math.min(
        0,
        this.liftVelocity + balanceConfig.monster.hitLiftRecovery * dt,
      );
    }

    if (now >= this.frozenUntil && this.type !== "boss") {
      this.rotation += balanceConfig.monster.rotationSpeed * deltaMs;
    }
  }

  takeDamage(damage: number, options: DamageOptions = {}): boolean {
    if (this.destroyed) return false;

    this.hp = Math.max(0, this.hp - damage);
    this.updateBossHpBar();

    if (options.impact ?? true) {
      this.applyLiftAndSlow(
        balanceConfig.monster.hitLiftVelocity,
        balanceConfig.monster.hitSlowMultiplier,
        balanceConfig.monster.hitSlowDuration,
      );
    }

    this.flash();
    this.playBossHitNudge();

    return this.hp <= 0;
  }

  applyBurst(liftVelocity: number, slowMultiplier: number, slowDuration: number): void {
    if (this.destroyed) return;

    this.applyLiftAndSlow(
      liftVelocity,
      slowMultiplier,
      slowDuration,
    );
    this.flash();
  }

  freeze(options: FreezeOptions): void {
    if (this.destroyed) return;

    const now = this.scene.time.now;
    const tintColor = options.tintColor ?? 0x5fb7ff;
    this.frozenUntil = Math.max(this.frozenUntil, now + options.durationMs);
    this.setFreezeTint(tintColor);
    this.scene.time.delayedCall(options.durationMs, () => {
      if (this.destroyed) {
        return;
      }

      if (this.scene.time.now >= this.frozenUntil) {
        this.clearFreezeTint();
      }
    });
  }

  setDebugVisible(visible: boolean): void {
    if (this.destroyed) return;

    this.collisionDebugBox.setVisible(visible);
  }

  destroy(fromScene?: boolean): void {
    this.destroyed = true;
    super.destroy(fromScene);
  }

  private applyLiftAndSlow(liftVelocity: number, slowMultiplier: number, slowDuration: number): void {
    const now = this.scene.time.now;
    const isBoss = this.type === "boss";
    const adjustedLiftVelocity = isBoss
      ? liftVelocity * balanceConfig.boss.liftVelocityMultiplier
      : liftVelocity;
    const adjustedSlowMultiplier = isBoss
      ? Math.max(slowMultiplier, balanceConfig.boss.slowMultiplier)
      : slowMultiplier;
    const adjustedSlowDuration = isBoss
      ? slowDuration * balanceConfig.boss.slowDurationMultiplier
      : slowDuration;

    this.slowMultiplier = adjustedSlowMultiplier;
    this.slowDuration = adjustedSlowDuration;
    this.slowedFrom = now;
    this.slowedUntil = now + adjustedSlowDuration;
    this.liftVelocity = Math.min(this.liftVelocity, -adjustedLiftVelocity);
  }

  private flash(): void {
    if (this.destroyed) return;

    const hasSprite = Boolean(this.sprite);

    if (hasSprite) {
      this.sprite?.setTint(0xffffdd);
      this.sprite?.setAlpha(1);
    } else {
      this.core.setFillStyle(0xffffff);
    }

    this.scene.time.delayedCall(80, () => {
      if (this.destroyed) {
        return;
      }

      if (this.scene.time.now < this.frozenUntil) {
        return;
      }

      this.core.setFillStyle(this.baseColor);
      this.sprite?.clearTint();
      this.sprite?.setAlpha(1);
    });
  }

  private playBossHitNudge(): void {
    if (this.destroyed || this.type !== "boss") {
      return;
    }

    this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 45,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  private setFreezeTint(tintColor: number): void {
    this.core.setFillStyle(tintColor);
    this.sprite?.setTint(tintColor);
  }

  private clearFreezeTint(): void {
    this.core.setFillStyle(this.baseColor);
    this.sprite?.clearTint();
  }

  private createBossHpBar(scene: Phaser.Scene): void {
    const width = Math.min(260, this.radius * 1.7);
    const height = 12;
    const y = -this.radius + 130;

    this.bossHpBarWidth = width;
    this.bossHpBarHeight = height;
    this.bossHpBarY = y;
    this.bossHpBar = scene.add.graphics();
    this.redrawBossHpBar(1);

    this.add(this.bossHpBar);
  }

  private updateBossHpBar(): void {
    if (!this.bossHpBar) {
      return;
    }

    const hpRatio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.redrawBossHpBar(hpRatio);
  }

  private redrawBossHpBar(hpRatio: number): void {
    if (!this.bossHpBar) {
      return;
    }

    const width = this.bossHpBarWidth;
    const height = this.bossHpBarHeight;
    const x = -width / 2;
    const y = this.bossHpBarY - height / 2;
    const radius = height / 2;
    const fillWidth = Math.max(0, width * hpRatio);
    const fillRadius = Math.min(radius - 2, fillWidth / 2);

    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(0x20131a, 0.86);
    this.bossHpBar.fillRoundedRect(x, y, width, height, radius);
    this.bossHpBar.lineStyle(2, 0xf6e7d7, 0.82);
    this.bossHpBar.strokeRoundedRect(x, y, width, height, radius);

    if (fillWidth <= 0) {
      return;
    }

    this.bossHpBar.fillStyle(0xff3f3f, 0.96);
    this.bossHpBar.fillRoundedRect(x + 2, y + 2, Math.max(0, fillWidth - 4), height - 4, fillRadius);
  }

  private createCore(scene: Phaser.Scene, shape: string, color: number): Phaser.GameObjects.Shape {
    if (shape === "square") {
      return scene.add.rectangle(0, 0, this.radius * 1.55, this.radius * 1.55, color);
    }

    if (shape === "diamond") {
      return scene.add.rectangle(0, 0, this.radius * 1.45, this.radius * 1.45, color).setRotation(Math.PI / 4);
    }

    return scene.add.circle(0, 0, this.radius, color);
  }
}
