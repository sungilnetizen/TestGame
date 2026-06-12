export type GameMode = "stage" | "endless" | "rift";

export type BossWaveRule = "stage-final" | "interval";

export type ModeDefinition = {
  id: GameMode;
  label: string;
  description: string;
  usesStageLength: boolean;
  hasStageClearReward: boolean;
  bossWaveRule: BossWaveRule;
  isUnlockedByDefault: boolean;
};

export const modeDefinitions: Record<GameMode, ModeDefinition> = {
  stage: {
    id: "stage",
    label: "Normal Mode",
    description: "Clear a selected stage.",
    usesStageLength: true,
    hasStageClearReward: true,
    bossWaveRule: "stage-final",
    isUnlockedByDefault: true,
  },
  endless: {
    id: "endless",
    label: "Endless Mode",
    description: "Farm as long as you can.",
    usesStageLength: false,
    hasStageClearReward: false,
    bossWaveRule: "interval",
    isUnlockedByDefault: true,
  },
  rift: {
    id: "rift",
    label: "Rift Mode",
    description: "Late-game endless challenge.",
    usesStageLength: false,
    hasStageClearReward: false,
    bossWaveRule: "interval",
    isUnlockedByDefault: false,
  },
};

export function getModeDefinition(mode: GameMode): ModeDefinition {
  return modeDefinitions[mode] ?? modeDefinitions.stage;
}
