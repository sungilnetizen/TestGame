import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { IMAGE_ASSETS } from "../assets/AssetManifest";
import type { Monster } from "../entities/Monster";
import type { Player } from "../entities/Player";
import type { RunUpgradeState } from "./UpgradeSystem";
import { CollisionSystem } from "./CollisionSystem";

type DamageMonsterOptions = {
  color: string;
  combo: boolean;
  impact: boolean;
  critical?: boolean;
};

type AttackOptions = {
  player: Player;
  getMonsters: () => Monster[];
  upgradeState: RunUpgradeState;
  isGameBlocked: () => boolean;
  damageMonster: (monster: Monster, damage: number, options: DamageMonsterOptions) => boolean;
};

export class AttackSystem {
  private lastAttackAt = -Infinity;
  private readonly burnTokens = new Map<Monster, number>();

  constructor(private readonly scene: Phaser.Scene) {}

  reset(): void {
    this.lastAttackAt = -Infinity;
    this.clearBurnTokens();
  }

  clearBurnTokens(): void {
    this.burnTokens.clear();
  }

  forgetMonster(monster: Monster): void {
    this.burnTokens.delete(monster);
  }

  tryAttack(options: AttackOptions): void {
    const now = this.scene.time.now;
    if (now - this.lastAttackAt < this.getAttackCooldown(options.upgradeState)) return;

    this.lastAttackAt = now;
    const isGroundAttack = options.player.isGrounded();
    const attackDamageMultiplier = isGroundAttack ? 0.55 : 1;
    options.player.softenJumpFromAttack();

    const attackCenterX = options.player.x;
    const attackCenterY = options.player.y + (isGroundAttack ? 18 : 8);
    const attackRadius = this.getAttackRadius(options.upgradeState) * (isGroundAttack ? 0.82 : 1);
    const attackArcDegrees = balanceConfig.combat.attackArcDegrees * (isGroundAttack ? 0.84 : 1);
    this.createSlashEffect(attackCenterX, attackCenterY, attackRadius, attackArcDegrees, options.upgradeState);

    let hitCount = 0;

    for (const monster of [...options.getMonsters()]) {
      if (CollisionSystem.attackHitsEnemy(attackCenterX, attackCenterY, attackRadius, monster)) {
        hitCount += 1;
        const attackDamage = this.rollAttackDamage(attackDamageMultiplier);
        const isDefeated = options.damageMonster(monster, attackDamage.damage, {
          color: "#fff1a8",
          combo: true,
          impact: !isGroundAttack,
          critical: attackDamage.isCritical,
        });

        if (!isDefeated && options.upgradeState.fireSword > 0) {
          this.applyBurn(monster, attackDamageMultiplier, options);
        }

        if (options.upgradeState.lightningSword > 0) {
          this.chainLightning(monster, attackDamageMultiplier, options);
        }
      }
    }

    if (hitCount > 0 && options.upgradeState.giantSword > 0) {
      this.scene.cameras.main.shake(80, 0.003);
    }

    if (options.upgradeState.phantomSword > 0) {
      this.scene.time.delayedCall(150, () => this.performPhantomSlash(isGroundAttack, attackDamageMultiplier, options));
    }
  }

  getAttackDamage(): number {
    return balanceConfig.combat.attackDamage;
  }

  private rollAttackDamage(multiplier = 1): { damage: number; isCritical: boolean } {
    const variance = balanceConfig.combat.attackDamageVariance;
    const damageRate = Phaser.Math.FloatBetween(1 - variance, 1 + variance);
    const isCritical = Phaser.Math.FloatBetween(0, 1) < balanceConfig.combat.criticalChance;
    const criticalRate = isCritical ? balanceConfig.combat.criticalMultiplier : 1;

    return {
      damage: this.getAttackDamage() * multiplier * damageRate * criticalRate,
      isCritical,
    };
  }

  private getAttackRadius(upgradeState: RunUpgradeState): number {
    return balanceConfig.combat.attackRadius + upgradeState.giantSword * 24;
  }

  private getAttackCooldown(upgradeState: RunUpgradeState): number {
    return balanceConfig.combat.attackCooldown * (1 + upgradeState.giantSword * 0.07);
  }

  private createSlashEffect(
    attackCenterX: number,
    attackCenterY: number,
    attackRadius: number,
    attackArcDegrees: number,
    upgradeState: RunUpgradeState,
  ): void {
    const attackArcStart = 270 - attackArcDegrees / 2;
    const attackArcEnd = 270 + attackArcDegrees / 2;

    if (this.scene.textures.exists(IMAGE_ASSETS.SLASH_BASIC.key)) {
      const slashImage = this.scene.add
        .image(attackCenterX, attackCenterY, IMAGE_ASSETS.SLASH_BASIC.key)
        .setDisplaySize(attackRadius * 2, attackRadius * 2)
        .setDepth(650);
      this.scene.tweens.add({
        targets: slashImage,
        alpha: 0,
        scaleX: upgradeState.giantSword > 0 ? 1.28 : 1.1,
        scaleY: upgradeState.giantSword > 0 ? 1.28 : 1.1,
        duration: balanceConfig.combat.slashDuration,
        onComplete: () => slashImage.destroy(),
      });
      return;
    }

    const slash = this.scene.add.graphics({ x: attackCenterX, y: attackCenterY });
    slash.fillStyle(upgradeState.fireSword > 0 ? 0xff6236 : 0xffe071, 0.32);
    slash.lineStyle(5, upgradeState.fireSword > 0 ? 0xffb15c : 0xfff6b0, 0.94);
    slash.beginPath();
    slash.moveTo(0, 0);

    for (let angle = attackArcStart; angle <= attackArcEnd; angle += 8) {
      const radians = Phaser.Math.DegToRad(angle);
      slash.lineTo(
        Math.cos(radians) * attackRadius,
        Math.sin(radians) * attackRadius,
      );
    }

    slash.closePath();
    slash.fillPath();
    slash.strokePath();

    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: upgradeState.giantSword > 0 ? 1.28 : 1.1,
      scaleY: upgradeState.giantSword > 0 ? 1.28 : 1.1,
      duration: balanceConfig.combat.slashDuration,
      onComplete: () => slash.destroy(),
    });
  }

  private applyBurn(monster: Monster, attackDamageMultiplier: number, options: AttackOptions): void {
    const burnDamage = Math.max(3, Math.round(this.getAttackDamage() * (0.06 + options.upgradeState.fireSword * 0.02)));
    const scaledBurnDamage = Math.max(1, Math.round(burnDamage * attackDamageMultiplier));
    const burnTicks = 3;
    const burnToken = (this.burnTokens.get(monster) ?? 0) + 1;
    this.burnTokens.set(monster, burnToken);

    for (let tick = 1; tick <= burnTicks; tick += 1) {
      this.scene.time.delayedCall(tick * 320, () => {
        if (
          options.isGameBlocked() ||
          !options.getMonsters().includes(monster) ||
          this.burnTokens.get(monster) !== burnToken
        ) {
          return;
        }

        options.damageMonster(monster, scaledBurnDamage, {
          color: "#ff7a2f",
          combo: false,
          impact: false,
          critical: false,
        });
      });
    }
  }

  private chainLightning(source: Monster, attackDamageMultiplier: number, options: AttackOptions): void {
    const maxChainDistance = 150 + options.upgradeState.lightningSword * 18;
    const target = options.getMonsters()
      .filter((monster) => monster !== source)
      .map((monster) => ({
        monster,
        distance: Phaser.Math.Distance.Between(source.x, source.y, monster.x, monster.y),
      }))
      .filter((candidate) => candidate.distance <= maxChainDistance)
      .sort((a, b) => a.distance - b.distance)[0]?.monster;

    if (!target) return;

    const line = this.scene.add
      .line(0, 0, source.x, source.y, target.x, target.y, 0x76d8ff, 0.95)
      .setOrigin(0)
      .setLineWidth(4)
      .setDepth(700);

    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 160,
      onComplete: () => line.destroy(),
    });

    options.damageMonster(target, this.getAttackDamage() * attackDamageMultiplier * (0.26 + options.upgradeState.lightningSword * 0.04), {
      color: "#76d8ff",
      combo: true,
      impact: true,
      critical: false,
    });
  }

  private performPhantomSlash(isGroundAttack: boolean, attackDamageMultiplier: number, options: AttackOptions): void {
    if (options.isGameBlocked()) return;

    const attackCenterX = options.player.x;
    const attackCenterY = options.player.y + (isGroundAttack ? 18 : 8);
    const attackRadius = this.getAttackRadius(options.upgradeState) * (isGroundAttack ? 0.82 : 1);
    const attackArcDegrees = balanceConfig.combat.attackArcDegrees * (isGroundAttack ? 0.84 : 1);
    const attackArcStart = 270 - attackArcDegrees / 2;
    const attackArcEnd = 270 + attackArcDegrees / 2;
    const phantom = this.scene.add.graphics({ x: attackCenterX, y: attackCenterY }).setDepth(650);
    phantom.fillStyle(0xb8c4ff, 0.18);
    phantom.lineStyle(4, 0xd9ddff, 0.66);
    phantom.beginPath();
    phantom.moveTo(0, 0);

    for (let angle = attackArcStart; angle <= attackArcEnd; angle += 8) {
      const radians = Phaser.Math.DegToRad(angle);
      phantom.lineTo(Math.cos(radians) * attackRadius, Math.sin(radians) * attackRadius);
    }

    phantom.closePath();
    phantom.fillPath();
    phantom.strokePath();

    this.scene.tweens.add({
      targets: phantom,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 220,
      onComplete: () => phantom.destroy(),
    });

    for (const monster of [...options.getMonsters()]) {
      if (CollisionSystem.attackHitsEnemy(attackCenterX, attackCenterY, attackRadius, monster)) {
        options.damageMonster(monster, this.getAttackDamage() * attackDamageMultiplier * (0.22 + options.upgradeState.phantomSword * 0.05), {
          color: "#d9ddff",
          combo: true,
          impact: !isGroundAttack,
          critical: false,
        });
      }
    }
  }
}
