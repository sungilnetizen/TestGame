import { balanceConfig } from "../config/balanceConfig";
import type { Monster } from "../entities/Monster";
import { SOUND_ASSETS } from "../assets/AssetManifest";
import type { AttackSystem } from "./AttackSystem";
import type { EffectSystem } from "./EffectSystem";
import type { EnemySystem } from "./EnemySystem";
import type { ScoreSystem } from "./ScoreSystem";
import type { SoundSystem } from "./SoundSystem";

export type DamageMonsterOptions = {
  color: string;
  combo: boolean;
  impact: boolean;
  critical?: boolean;
  flashColor?: number;
  burnEffect?: boolean;
  lightningEffect?: boolean;
};

type CombatResolutionOptions = {
  enemySystem: EnemySystem;
  effectSystem: EffectSystem;
  scoreSystem: ScoreSystem;
  soundSystem: SoundSystem;
  attackSystem: AttackSystem;
  setScore: (score: number) => void;
  setCombo: (combo: number) => void;
  onMonsterKilled: (monster: Monster) => void;
};

export class CombatResolutionSystem {
  constructor(private readonly options: CombatResolutionOptions) {}

  damageMonster(monster: Monster, damage: number, options: DamageMonsterOptions): boolean {
    if (!this.options.enemySystem.includes(monster)) return false;

    const roundedDamage = Math.max(1, Math.round(damage));
    const isDefeated = monster.takeDamage(roundedDamage, {
      impact: options.impact,
      flashColor: options.flashColor,
    });
    this.options.effectSystem.showDamageNumber(
      monster.x,
      monster.y - monster.radius,
      roundedDamage,
      options.color,
      options.critical,
    );
    if (options.burnEffect) {
      this.options.effectSystem.createBurnEffect(monster.x, monster.y, monster.radius);
    }
    if (options.lightningEffect) {
      this.options.effectSystem.createLightningHitEffect(monster.x, monster.y, monster.radius);
    }
    this.showBossHitEffect(monster);
    this.applyScoreForHit(monster, isDefeated, options.combo);

    if (isDefeated) {
      this.defeatMonster(monster, options.combo);
    }

    return isDefeated;
  }

  private applyScoreForHit(monster: Monster, isDefeated: boolean, shouldCombo: boolean): void {
    if (shouldCombo) {
      const scoreState = this.options.scoreSystem.addComboScore(isDefeated);
      this.options.setCombo(scoreState.combo);
      this.options.setScore(scoreState.score);
      this.options.soundSystem.playSfx(SOUND_ASSETS.HIT.key);
      return;
    }

    if (isDefeated) {
      this.options.setScore(this.options.scoreSystem.addScore(monster.scoreValue).score);
    }
  }

  private defeatMonster(monster: Monster, shouldCombo: boolean): void {
    this.options.attackSystem.forgetMonster(monster);
    this.options.soundSystem.playSfx(monster.type === "boss" ? SOUND_ASSETS.BOSS_DEFEAT.key : SOUND_ASSETS.KILL.key);
    this.createDefeatEffect(monster);

    if (shouldCombo) {
      const scoreState = this.options.scoreSystem.addScore(monster.scoreValue - balanceConfig.combat.scorePerKill);
      this.options.setScore(scoreState.score);
    }

    this.options.enemySystem.removeMonster(monster);
    this.options.onMonsterKilled(monster);
  }

  private showBossHitEffect(monster: Monster): void {
    if (monster.type !== "boss") {
      return;
    }

    this.options.effectSystem.createSlashMarkEffect(
      monster.x,
      monster.y + balanceConfig.boss.slashMarkYOffset,
      monster.radius * balanceConfig.boss.slashMarkRadiusMultiplier,
    );
  }

  private createDefeatEffect(monster: Monster): void {
    const defeatEffectRadius = monster.type === "boss"
      ? monster.radius * balanceConfig.boss.slashMarkRadiusMultiplier
      : monster.radius;
    const defeatEffectY = monster.type === "boss"
      ? monster.y + balanceConfig.boss.slashMarkYOffset
      : monster.y;

    this.options.effectSystem.createMonsterDefeatEffect(monster.x, defeatEffectY, defeatEffectRadius);
  }
}
