import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { enemyDefinitions, type EnemyType } from "../data/enemies";

type MonsterOptions = {
  hp?: number;
  fallSpeed?: number;
  type?: EnemyType;
};

type DamageOptions = {
  impact?: boolean;
};

type FreezeOptions = {
  durationMs: number;
  tintColor?: number;
};

export class Monster extends Phaser.GameObjects.Container {
  readonly radius: number;
  readonly scoreValue: number;
  private readonly core: Phaser.GameObjects.Shape;
  private readonly collisionDebugBox: Phaser.GameObjects.Rectangle;
  private sprite?: Phaser.GameObjects.Image;
  private readonly baseColor: number;
  private readonly fallSpeed: number;
  private hp: number = balanceConfig.monster.maxHp;
  private liftVelocity = 0;
  private slowMultiplier = 1;
  private slowDuration = 1;
  private slowedFrom = -Infinity;
  private slowedUntil = -Infinity;
  private frozenUntil = -Infinity;

  constructor(scene: Phaser.Scene, x: number, y: number, options: MonsterOptions = {}) {
    super(scene, x, y);

    const monsterType = options.type ?? "normal";
    const typeConfig = enemyDefinitions[monsterType];
    this.radius = typeConfig.radius;
    this.scoreValue = typeConfig.scoreValue;
    this.baseColor = typeConfig.color;
    this.hp = options.hp ?? balanceConfig.monster.maxHp;
    this.fallSpeed =
      (options.fallSpeed ?? balanceConfig.monster.fallSpeed) +
      Phaser.Math.Between(balanceConfig.monster.fallSpeedRandomMin, balanceConfig.monster.fallSpeedRandomMax);
    this.core = this.createCore(scene, typeConfig.shape, typeConfig.color);
    this.collisionDebugBox = scene.add
      .rectangle(0, 0, this.radius * 2, this.radius * 2, 0xff3d3d, 0.06)
      .setStrokeStyle(2, 0xff3d3d, 0.38);
    const eye = scene.add.rectangle(0, -3, 18, 5, 0xf8f1ff);

    if (scene.textures.exists(typeConfig.assetKey)) {
      this.sprite = scene.add
        .image(0, 0, typeConfig.assetKey)
        .setDisplaySize(this.radius * 2, this.radius * 2);
      this.core.setVisible(false);
      eye.setVisible(false);
      this.add([this.sprite, this.core, eye, this.collisionDebugBox]);
    } else {
      this.add([this.core, eye, this.collisionDebugBox]);
    }

    scene.add.existing(this);
  }

  updateMonster(deltaMs: number): void {
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

    if (now >= this.frozenUntil) {
      this.rotation += balanceConfig.monster.rotationSpeed * deltaMs;
    }
  }

  takeDamage(damage: number, options: DamageOptions = {}): boolean {
    this.hp = Math.max(0, this.hp - damage);

    if (options.impact ?? true) {
      this.applyLiftAndSlow(
        balanceConfig.monster.hitLiftVelocity,
        balanceConfig.monster.hitSlowMultiplier,
        balanceConfig.monster.hitSlowDuration,
      );
    }

    this.flash();

    return this.hp <= 0;
  }

  applyBurst(liftVelocity: number, slowMultiplier: number, slowDuration: number): void {
    this.applyLiftAndSlow(
      liftVelocity,
      slowMultiplier,
      slowDuration,
    );
    this.flash();
  }

  freeze(options: FreezeOptions): void {
    const now = this.scene.time.now;
    const tintColor = options.tintColor ?? 0x5fb7ff;
    this.frozenUntil = Math.max(this.frozenUntil, now + options.durationMs);
    this.setFreezeTint(tintColor);
    this.scene.time.delayedCall(options.durationMs, () => {
      if (this.scene.time.now >= this.frozenUntil) {
        this.clearFreezeTint();
      }
    });
  }

  setDebugVisible(visible: boolean): void {
    this.collisionDebugBox.setVisible(visible);
  }

  private applyLiftAndSlow(liftVelocity: number, slowMultiplier: number, slowDuration: number): void {
    const now = this.scene.time.now;
    this.slowMultiplier = slowMultiplier;
    this.slowDuration = slowDuration;
    this.slowedFrom = now;
    this.slowedUntil = now + slowDuration;
    this.liftVelocity = Math.min(this.liftVelocity, -liftVelocity);
  }

  private flash(): void {
    this.core.setFillStyle(0xf4e36f);
    this.scene.time.delayedCall(80, () => this.core.setFillStyle(this.baseColor));
  }

  private setFreezeTint(tintColor: number): void {
    this.core.setFillStyle(tintColor);
    this.sprite?.setTint(tintColor);
  }

  private clearFreezeTint(): void {
    this.core.setFillStyle(this.baseColor);
    this.sprite?.clearTint();
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
