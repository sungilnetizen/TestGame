export type StageDefinition = {
  id: number;
  name: string;
  durationMinutes: number;
  waveCount: number;
  bossAssetKey: string;
  difficultyMultiplier: number;
  rewardGold: number;
};

export const stageDefinitions: StageDefinition[] = [
  { id: 1, name: "Stage 1", durationMinutes: 5, waveCount: 6, bossAssetKey: "enemy_boss", difficultyMultiplier: 1, rewardGold: 250 },
  { id: 2, name: "Stage 2", durationMinutes: 6, waveCount: 8, bossAssetKey: "enemy_boss_wave_10", difficultyMultiplier: 1.45, rewardGold: 420 },
  { id: 3, name: "Stage 3", durationMinutes: 7, waveCount: 9, bossAssetKey: "enemy_boss_wave_15", difficultyMultiplier: 2.05, rewardGold: 650 },
  { id: 4, name: "Stage 4", durationMinutes: 8, waveCount: 10, bossAssetKey: "enemy_boss_wave_20", difficultyMultiplier: 2.85, rewardGold: 940 },
  { id: 5, name: "Stage 5", durationMinutes: 9, waveCount: 11, bossAssetKey: "enemy_boss_wave_25", difficultyMultiplier: 3.85, rewardGold: 1300 },
  { id: 6, name: "Stage 6", durationMinutes: 10, waveCount: 12, bossAssetKey: "enemy_boss_wave_30", difficultyMultiplier: 5, rewardGold: 1800 },
];

export function getStageDefinition(stageId: number): StageDefinition {
  return stageDefinitions.find((stage) => stage.id === stageId) ?? stageDefinitions[0];
}
