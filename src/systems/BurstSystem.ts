import type { Monster } from "../entities/Monster";
import { balanceConfig } from "../config/balanceConfig";
import type { RunUpgradeState } from "./UpgradeSystem";

type BurstOptions = {
  time: number;
  monsters: Monster[];
  upgradeState: RunUpgradeState;
  attackDamage: number;
  setCooldownDisplay: (remainingMs: number, cooldownMs: number) => void;
  createBurstEffect: () => void;
  shakeCamera: () => void;
  damageMonster: (monster: Monster, damage: number) => void;
};

export class BurstSystem {
  private nextBurstAt = 0;

  reset(): void {
    this.nextBurstAt = 0;
  }

  updateCooldownDisplay(time: number, upgradeState: RunUpgradeState, setCooldownDisplay: (remainingMs: number, cooldownMs: number) => void): void {
    setCooldownDisplay(this.nextBurstAt - time, this.getBurstCooldown(upgradeState));
  }

  tryBurst(options: BurstOptions): void {
    if (options.time < this.nextBurstAt) return;

    const burstCooldown = this.getBurstCooldown(options.upgradeState);
    this.nextBurstAt = options.time + burstCooldown;
    options.setCooldownDisplay(burstCooldown, burstCooldown);

    for (const monster of options.monsters) {
      monster.applyBurst(
        this.getBurstLiftVelocity(options.upgradeState),
        this.getBurstSlowMultiplier(),
        this.getBurstSlowDuration(options.upgradeState),
      );
    }

    if (options.upgradeState.holyBurst > 0) {
      const damage = options.attackDamage * (0.14 + options.upgradeState.holyBurst * 0.03);

      for (const monster of [...options.monsters]) {
        options.damageMonster(monster, damage);
      }
    }

    options.createBurstEffect();
    options.shakeCamera();
  }

  private getBurstCooldown(upgradeState: RunUpgradeState): number {
    return balanceConfig.burst.cooldown * Math.pow(0.9, upgradeState.manaCircuit);
  }

  private getBurstLiftVelocity(upgradeState: RunUpgradeState): number {
    return balanceConfig.burst.liftVelocity + upgradeState.earthRebound * 18;
  }

  private getBurstSlowMultiplier(): number {
    return balanceConfig.burst.slowMultiplier;
  }

  private getBurstSlowDuration(upgradeState: RunUpgradeState): number {
    return balanceConfig.burst.slowDuration + upgradeState.timeRune * 220;
  }
}
