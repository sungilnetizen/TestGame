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
    this.fallSpeed = (options.fallSpeed ?? balanceConfig.monster.fallSpeed) + Phaser.Math.Between(-12, 18);
    this.core = this.createCore(scene, typeConfig.shape, typeConfig.color);
    const eye = scene.add.rectangle(0, -3, 18, 5, 0xf8f1ff);

    this.add([this.core, eye]);
    scene.add.existing(this);
  }

  updateMonster(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const now = this.scene.time.now;
    let speedMultiplier = 1;

    if (now < this.frozenUntil) {
      speedMultiplier = 0;
      this.core.setFillStyle(0x5fb7ff);
    } else if (this.core.fillColor !== this.baseColor) {
      this.core.setFillStyle(this.baseColor);
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

    this.rotation += 0.0007 * deltaMs;
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
    this.frozenUntil = Math.max(this.frozenUntil, now + options.durationMs);
    this.core.setFillStyle(options.tintColor ?? 0x5fb7ff);
    this.scene.time.delayedCall(options.durationMs, () => {
      if (this.scene.time.now >= this.frozenUntil) {
        this.core.setFillStyle(this.baseColor);
      }
    });
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
