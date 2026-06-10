import { balanceConfig } from "../config/balanceConfig";

export type ScoreState = {
  score: number;
  combo: number;
  highestCombo: number;
};

export class ScoreSystem {
  private score = 0;
  private combo = 0;
  private highestCombo = 0;

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.highestCombo = 0;
  }

  addComboScore(isKill: boolean): ScoreState {
    this.combo += 1;
    this.highestCombo = Math.max(this.highestCombo, this.combo);
    this.score +=
      balanceConfig.combat.scorePerHit +
      this.combo * balanceConfig.combat.comboScoreBonus +
      (isKill ? balanceConfig.combat.scorePerKill : 0);

    return this.getState();
  }

  addScore(value: number): ScoreState {
    this.score += value;
    return this.getState();
  }

  subtractScore(value: number): ScoreState {
    this.score = Math.max(0, this.score - value);
    return this.getState();
  }

  resetCombo(): ScoreState {
    if (this.combo === 0) return this.getState();

    this.combo = 0;
    return this.getState();
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.combo;
  }

  getHighestCombo(): number {
    return this.highestCombo;
  }

  getState(): ScoreState {
    return {
      score: this.score,
      combo: this.combo,
      highestCombo: this.highestCombo,
    };
  }
}
