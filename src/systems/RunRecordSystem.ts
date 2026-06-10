const BEST_SCORE_KEY = "riftBlade.bestScore";
const BEST_COMBO_KEY = "riftBlade.bestCombo";

export type RunRecords = {
  bestScore: number;
  bestCombo: number;
};

export class RunRecordSystem {
  getRecords(): RunRecords {
    return {
      bestScore: this.readNumber(BEST_SCORE_KEY),
      bestCombo: this.readNumber(BEST_COMBO_KEY),
    };
  }

  saveRun(score: number, combo: number): RunRecords {
    const records = this.getRecords();
    const bestScore = Math.max(records.bestScore, score);
    const bestCombo = Math.max(records.bestCombo, combo);

    this.writeNumber(BEST_SCORE_KEY, bestScore);
    this.writeNumber(BEST_COMBO_KEY, bestCombo);

    return { bestScore, bestCombo };
  }

  private readNumber(key: string): number {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) ? value : 0;
  }

  private writeNumber(key: string, value: number): void {
    window.localStorage.setItem(key, String(value));
  }
}
