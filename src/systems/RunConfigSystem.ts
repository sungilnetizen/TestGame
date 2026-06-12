import { characterDefinitions } from "../data/characters";
import { getModeDefinition } from "../data/modes";
import { getStageDefinition } from "../data/stages";
import { SaveSystem } from "./SaveSystem";
import type { GameDifficulty, GameRunConfig, GameRunStartData } from "../types/GameRunTypes";

export class RunConfigSystem {
  static create(data: GameRunStartData = {}): GameRunConfig {
    const saveData = SaveSystem.load();
    const mode = data.mode ?? "stage";
    const modeDefinition = getModeDefinition(mode);
    const difficulty = data.difficulty ?? "normal";
    const stageId = data.stageId ?? saveData.selectedStageId;
    const characterId = data.characterId ?? saveData.selectedCharacterId;
    const stage = getStageDefinition(stageId);
    const character =
      characterDefinitions.find((candidate) => candidate.id === characterId) ?? characterDefinitions[0];
    const difficultyRate = this.getDifficultyRate(difficulty);

    return {
      mode,
      modeDefinition,
      difficulty,
      stageId: stage.id,
      characterId: character.id,
      stage,
      character,
      maxWave: modeDefinition.usesStageLength ? stage.waveCount : null,
      difficultyMultiplier: modeDefinition.usesStageLength ? stage.difficultyMultiplier * difficultyRate : difficultyRate,
    };
  }

  private static getDifficultyRate(difficulty: GameDifficulty): number {
    if (difficulty === "easy") return 0.85;
    if (difficulty === "hard") return 1.25;

    return 1;
  }
}
