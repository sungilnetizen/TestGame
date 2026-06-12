import { balanceConfig } from "../config/balanceConfig";
import { SaveSystem } from "./SaveSystem";
import type { GameRunConfig } from "../types/GameRunTypes";

export type RunResult = "clear" | "gameover";

export type ProgressionResult = {
  gold: number;
  unlockMessages: string[];
};

export class ProgressionSystem {
  static finishRun(runConfig: GameRunConfig, result: RunResult, score: number, runGold?: number): ProgressionResult {
    const gold = this.calculateEarnedGold(runConfig, result, score, runGold);
    const unlockMessages: string[] = [];

    SaveSystem.addGold(gold);

    if (result === "clear" && runConfig.modeDefinition.hasStageClearReward) {
      SaveSystem.markStageCleared(runConfig.stageId);
      unlockMessages.push(`${runConfig.stage.name} cleared`);
    }

    return {
      gold,
      unlockMessages,
    };
  }

  private static calculateEarnedGold(
    runConfig: GameRunConfig,
    result: RunResult,
    score: number,
    runGold?: number,
  ): number {
    const scoreGold = runGold ?? Math.floor(score * balanceConfig.run.goldPerScore);
    const clearGold = result === "clear" && runConfig.modeDefinition.hasStageClearReward ? runConfig.stage.rewardGold : 0;

    return scoreGold + clearGold;
  }
}
