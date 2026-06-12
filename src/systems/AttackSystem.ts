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
    const attackDamageMultiplier = isGroundAttack ? balanceConfig.combat.groundAttackDamageMultiplier : 1;
    options.player.softenJumpFromAttack();

    const attackCenterX = options.player.x;
    const attackCenterY = options.player.y + (isGroundAttack ? balanceConfig.combat.groundAttackYOffset : balanceConfig.combat.airAttackYOffset);
    const attackRadius = this.getAttackRadius(options.upgradeState) * (isGroundAttack ? balanceConfig.combat.groundAttackRadiusMultiplier : 1);
    const attackArcDegrees = balanceConfig.combat.attackArcDegrees * (isGroundAttack ? balanceConfig.combat.groundAttackArcMultiplier : 1);
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

        if (isDefeated) {
          continue;
        }

        if (options.upgradeState.fireSword > 0) {
          this.applyBurn(monster, attackDamageMultiplier, options);
        }

        if (options.upgradeState.lightningSword > 0) {
          this.chainLightning(monster, attackDamageMultiplier, options);
        }
      }
    }

    if (hitCount > 0 && options.upgradeState.giantSword > 0) {
      this.scene.cameras.main.shake(balanceConfig.combat.giantSwordShakeDuration, balanceConfig.combat.giantSwordShakeIntensity);
    }

    if (options.upgradeState.phantomSword > 0) {
      this.scene.time.delayedCall(balanceConfig.combat.phantomSwordDelay, () => this.performPhantomSlash(isGroundAttack, attackDamageMultiplier, options));
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
    return balanceConfig.combat.attackRadius + upgradeState.giantSword * balanceConfig.combat.giantSwordRadiusBonus;
  }

  private getAttackCooldown(upgradeState: RunUpgradeState): number {
    return balanceConfig.combat.attackCooldown * (1 + upgradeState.giantSword * balanceConfig.combat.giantSwordCooldownPenalty);
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
    const slashRange = this.createSlashRange(
      attackCenterX,
      attackCenterY,
      attackRadius,
      attackArcStart,
      attackArcEnd,
      upgradeState,
    );

    if (this.scene.textures.exists(IMAGE_ASSETS.SLASH_BASIC.key)) {
      const slashImage = this.scene.add
        .image(attackCenterX, attackCenterY, IMAGE_ASSETS.SLASH_BASIC.key)
        .setDisplaySize(attackRadius * 2, attackRadius * 2)
        .setDepth(691);
      const maskGraphics = this.createSlashMask(
        attackCenterX,
        attackCenterY,
        attackRadius,
        attackArcStart,
        attackArcEnd,
      );
      const mask = maskGraphics.createGeometryMask();
      slashImage.setMask(mask);

      this.scene.tweens.add({
        targets: [slashImage, slashRange],
        alpha: 0,
        duration: balanceConfig.combat.slashDuration,
        onComplete: () => {
          slashImage.destroy();
          slashRange.destroy();
          maskGraphics.destroy();
        },
      });
      return;
    }

    this.scene.tweens.add({
      targets: slashRange,
      alpha: 0,
      duration: balanceConfig.combat.slashDuration,
      onComplete: () => slashRange.destroy(),
    });
  }

  private createSlashRange(
    attackCenterX: number,
    attackCenterY: number,
    attackRadius: number,
    attackArcStart: number,
    attackArcEnd: number,
    upgradeState: RunUpgradeState,
  ): Phaser.GameObjects.Graphics {
    const slash = this.scene.add.graphics({ x: attackCenterX, y: attackCenterY }).setDepth(690);
    slash.fillStyle(upgradeState.fireSword > 0 ? 0xff6236 : 0xffe071, 0.2);
    slash.lineStyle(4, upgradeState.fireSword > 0 ? 0xffb15c : 0xfff6b0, 0.78);
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

    return slash;
  }

  private createSlashMask(
    attackCenterX: number,
    attackCenterY: number,
    attackRadius: number,
    attackArcStart: number,
    attackArcEnd: number,
  ): Phaser.GameObjects.Graphics {
    const maskGraphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.beginPath();
    maskGraphics.moveTo(attackCenterX, attackCenterY);

    for (let angle = attackArcStart; angle <= attackArcEnd; angle += 8) {
      const radians = Phaser.Math.DegToRad(angle);
      maskGraphics.lineTo(
        attackCenterX + Math.cos(radians) * attackRadius,
        attackCenterY + Math.sin(radians) * attackRadius,
      );
    }

    maskGraphics.closePath();
    maskGraphics.fillPath();

    return maskGraphics;
  }

  private applyBurn(monster: Monster, attackDamageMultiplier: number, options: AttackOptions): void {
    const burnDamage = Math.max(
      balanceConfig.combat.fireSwordMinBurnDamage,
      Math.round(
        this.getAttackDamage() *
          (balanceConfig.combat.fireSwordBaseBurnRate +
            options.upgradeState.fireSword * balanceConfig.combat.fireSwordLevelBurnRate),
      ),
    );
    const scaledBurnDamage = Math.max(1, Math.round(burnDamage * attackDamageMultiplier));
    const burnTicks = balanceConfig.combat.fireSwordTicks;
    const burnToken = (this.burnTokens.get(monster) ?? 0) + 1;
    this.burnTokens.set(monster, burnToken);

    for (let tick = 1; tick <= burnTicks; tick += 1) {
      this.scene.time.delayedCall(tick * balanceConfig.combat.fireSwordTickInterval, () => {
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
    const maxChainDistance =
      balanceConfig.combat.lightningSwordBaseRange +
      options.upgradeState.lightningSword * balanceConfig.combat.lightningSwordLevelRange;
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
      duration: balanceConfig.combat.lightningSwordEffectDuration,
      onComplete: () => line.destroy(),
    });

    options.damageMonster(target, this.getAttackDamage() * attackDamageMultiplier * (balanceConfig.combat.lightningSwordBaseDamageRate + options.upgradeState.lightningSword * balanceConfig.combat.lightningSwordLevelDamageRate), {
      color: "#76d8ff",
      combo: true,
      impact: true,
      critical: false,
    });
  }

  private performPhantomSlash(isGroundAttack: boolean, attackDamageMultiplier: number, options: AttackOptions): void {
    if (options.isGameBlocked()) return;

    const attackCenterX = options.player.x;
    const attackCenterY = options.player.y + (isGroundAttack ? balanceConfig.combat.groundAttackYOffset : balanceConfig.combat.airAttackYOffset);
    const attackRadius = this.getAttackRadius(options.upgradeState) * (isGroundAttack ? balanceConfig.combat.groundAttackRadiusMultiplier : 1);
    const attackArcDegrees = balanceConfig.combat.attackArcDegrees * (isGroundAttack ? balanceConfig.combat.groundAttackArcMultiplier : 1);
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
      duration: balanceConfig.combat.phantomSwordEffectDuration,
      onComplete: () => phantom.destroy(),
    });

    for (const monster of [...options.getMonsters()]) {
      if (CollisionSystem.attackHitsEnemy(attackCenterX, attackCenterY, attackRadius, monster)) {
        options.damageMonster(monster, this.getAttackDamage() * attackDamageMultiplier * (balanceConfig.combat.phantomSwordBaseDamageRate + options.upgradeState.phantomSword * balanceConfig.combat.phantomSwordLevelDamageRate), {
          color: "#d9ddff",
          combo: true,
          impact: !isGroundAttack,
          critical: false,
        });
      }
    }
  }
}
