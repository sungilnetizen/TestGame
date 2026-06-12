import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import type { Monster } from "../entities/Monster";
import type { Player } from "../entities/Player";
import { CollisionSystem } from "./CollisionSystem";
import type { EffectSystem } from "./EffectSystem";
import type { EnemySystem } from "./EnemySystem";
import type { ScoreSystem } from "./ScoreSystem";
import type { WaveSystem } from "./WaveSystem";

type PlayerDamageSystemOptions = {
  scene: Phaser.Scene;
  player: Player;
  enemySystem: EnemySystem;
  effectSystem: EffectSystem;
  scoreSystem: ScoreSystem;
  waveSystem: WaveSystem;
  setLife: (life: number) => void;
  setScore: (score: number) => void;
  setCombo: (combo: number) => void;
  clearMonsters: () => void;
};

export class PlayerDamageSystem {
  private life = balanceConfig.run.startingLife;

  constructor(private readonly options: PlayerDamageSystemOptions) {}

  reset(): void {
    this.life = balanceConfig.run.startingLife;
    this.options.setLife(this.life);
  }

  resolve(): boolean {
    if (this.resolvePlayerMonsterCollision()) {
      return true;
    }

    return this.resolveDefenseLine();
  }

  private resolvePlayerMonsterCollision(): boolean {
    for (const monster of this.options.enemySystem.getMonsters()) {
      if (CollisionSystem.groundedPlayerHitsEnemy(this.options.player, monster)) {
        if (monster.type === "boss") {
          return true;
        }

        this.loseLifeFromEnemy(monster);
        return this.life <= 0;
      }

      if (CollisionSystem.playerHitsEnemy(this.options.player, monster)) {
        this.options.player.forceFall();
        this.resetCombo();
        return false;
      }
    }

    return false;
  }

  private resolveDefenseLine(): boolean {
    const monsters = this.options.enemySystem.getMonsters();
    const reachedMonster = monsters.find(
      (monster) => CollisionSystem.enemyReachedBottom(monster, this.options.effectSystem.getDefenseLineY()),
    );

    if (!reachedMonster) {
      return false;
    }

    if (reachedMonster.type === "boss") {
      return true;
    }

    this.loseLifeFromEnemy(reachedMonster);
    return this.life <= 0;
  }

  private loseLifeFromEnemy(monster: Monster): void {
    const lifeDamage = this.getLifeDamageForMonster(monster);
    const hadBoss = this.options.enemySystem.getMonsters().some((candidate) => candidate.type === "boss");

    this.life -= lifeDamage;
    this.options.player.flashHit();
    const scoreState = this.options.scoreSystem.subtractScore(balanceConfig.run.lifeLossScorePenalty * lifeDamage);
    this.options.setLife(this.life);
    this.options.setScore(scoreState.score);
    this.resetCombo();
    this.options.clearMonsters();
    this.options.scene.cameras.main.shake(balanceConfig.run.lifeLossShakeDuration, balanceConfig.run.lifeLossShakeIntensity);

    if (hadBoss) {
      this.options.waveSystem.releaseBoss();
    }
  }

  private resetCombo(): void {
    const previousCombo = this.options.scoreSystem.getCombo();
    const scoreState = this.options.scoreSystem.resetCombo();
    if (previousCombo === scoreState.combo) return;

    this.options.setCombo(scoreState.combo);
  }

  private getLifeDamageForMonster(monster: Monster): number {
    return monster.type === "boss" ? balanceConfig.boss.lifeDamage : 1;
  }
}
