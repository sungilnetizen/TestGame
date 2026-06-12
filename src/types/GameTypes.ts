import type { GameMode } from "../data/modes";

export type ControlAction = "jump" | "attack" | "burst";

export type GameOverData = {
  score: number;
  gold: number;
  wave: number;
  highestCombo: number;
  bestScore: number;
  bestCombo: number;
  result: "clear" | "gameover";
  mode: GameMode;
  stageName: string;
  upgrades: string[];
  unlockMessages: string[];
};
