export type ControlAction = "jump" | "attack" | "burst";

export type GameOverData = {
  score: number;
  wave: number;
  highestCombo: number;
  bestScore: number;
  bestCombo: number;
  upgrades: string[];
};
