import type { EnemyType } from "./enemies";

export type WaveConfig = {
  wave: number;
  killsToNext: number;
  monsterHp: number;
  fallSpeed: number;
  spawnInterval: number;
  maxAlive: number;
  groupMin: number;
  groupMax: number;
  groupSpread: number;
  monsterWeights: Record<EnemyType, number>;
};

export const createWaveConfigs = (): WaveConfig[] =>
  Array.from({ length: 30 }, (_, index) => {
    const wave = index + 1;
    const lateWave = Math.max(0, wave - 5);

    return {
      wave,
      killsToNext: Math.round((wave <= 5 ? [20, 35, 50, 70, 100][index] : 100 + lateWave * 28) * 1.5),
      monsterHp: 24 + wave * 14,
      fallSpeed: 88 + wave * 7,
      spawnInterval: Math.max(240, 880 - wave * 30),
      maxAlive: Math.min(51, Math.round((6 + Math.floor(wave * 1.1)) * 1.5)),
      groupMin: Math.min(15, Math.round((1 + Math.floor(wave / 1.7)) * 1.5)),
      groupMax: Math.min(21, Math.round((3 + Math.floor(wave / 1.45)) * 1.5)),
      groupSpread: Math.min(68, 20 + wave * 1.6),
      monsterWeights: {
        small: Math.max(6, 44 - wave * 1.25),
        normal: Math.max(22, 44 - Math.floor(wave * 0.45)),
        tank: wave >= 2 ? 12 + Math.floor(wave * 1.3) : 0,
        swift: wave >= 4 ? 12 + Math.floor(wave * 1.1) : 0,
        brute: wave >= 8 ? 10 + Math.floor(wave * 0.95) : 0,
        orb: wave >= 12 ? 8 + Math.floor(wave * 0.75) : 0,
      },
    };
  });

export const waveConfigs = createWaveConfigs();
