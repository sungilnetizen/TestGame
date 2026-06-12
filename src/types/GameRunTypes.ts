import type { CharacterDefinition } from "../data/characters";
import type { GameMode, ModeDefinition } from "../data/modes";
import type { StageDefinition } from "../data/stages";

export type GameDifficulty = "easy" | "normal" | "hard";

export type GameRunConfig = {
  mode: GameMode;
  modeDefinition: ModeDefinition;
  difficulty: GameDifficulty;
  stageId: number;
  characterId: string;
  stage: StageDefinition;
  character: CharacterDefinition;
  maxWave: number | null;
  difficultyMultiplier: number;
};

export type GameRunStartData = {
  mode?: GameMode;
  difficulty?: GameDifficulty;
  stageId?: number;
  characterId?: string;
};
