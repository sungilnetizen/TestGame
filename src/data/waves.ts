import type { EnemyType } from "./enemies";
import { balanceConfig } from "../config/balanceConfig";

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
  Array.from({ length: balanceConfig.waves.count }, (_, index) => {
    const wave = index + 1;
    const lateWave = Math.max(0, wave - balanceConfig.waves.lateWaveStart);
    const earlyKillsToNext = balanceConfig.waves.earlyKillsToNext[index];
    const killsToNext = wave <= balanceConfig.waves.lateWaveStart
      ? earlyKillsToNext
      : balanceConfig.waves.lateKillsBase + lateWave * balanceConfig.waves.lateKillsPerWave;

    return {
      wave,
      killsToNext: Math.round(killsToNext * balanceConfig.waves.monsterCountMultiplier),
      monsterHp: balanceConfig.waves.monsterHpBase + wave * balanceConfig.waves.monsterHpPerWave,
      fallSpeed: balanceConfig.waves.fallSpeedBase + wave * balanceConfig.waves.fallSpeedPerWave,
      spawnInterval: Math.max(
        balanceConfig.waves.spawnIntervalMin,
        balanceConfig.waves.spawnIntervalBase - wave * balanceConfig.waves.spawnIntervalReductionPerWave,
      ),
      maxAlive: Math.min(
        balanceConfig.waves.maxAliveCap,
        Math.round(
          (balanceConfig.waves.maxAliveBase + Math.floor(wave * balanceConfig.waves.maxAlivePerWave)) *
            balanceConfig.waves.monsterCountMultiplier,
        ),
      ),
      groupMin: Math.min(
        balanceConfig.waves.groupMinCap,
        Math.round(
          (balanceConfig.waves.groupMinBase + Math.floor(wave / balanceConfig.waves.groupMinWaveDivisor)) *
            balanceConfig.waves.monsterCountMultiplier,
        ),
      ),
      groupMax: Math.min(
        balanceConfig.waves.groupMaxCap,
        Math.round(
          (balanceConfig.waves.groupMaxBase + Math.floor(wave / balanceConfig.waves.groupMaxWaveDivisor)) *
            balanceConfig.waves.monsterCountMultiplier,
        ),
      ),
      groupSpread: Math.min(
        balanceConfig.waves.groupSpreadCap,
        balanceConfig.waves.groupSpreadBase + wave * balanceConfig.waves.groupSpreadPerWave,
      ),
      monsterWeights: {
        small: Math.max(
          balanceConfig.waves.smallWeightMin,
          balanceConfig.waves.smallWeightBase - wave * balanceConfig.waves.smallWeightReductionPerWave,
        ),
        normal: Math.max(
          balanceConfig.waves.normalWeightMin,
          balanceConfig.waves.normalWeightBase - Math.floor(wave * balanceConfig.waves.normalWeightReductionPerWave),
        ),
        tank: wave >= balanceConfig.waves.tankStartWave
          ? balanceConfig.waves.tankWeightBase + Math.floor(wave * balanceConfig.waves.tankWeightPerWave)
          : 0,
        swift: wave >= balanceConfig.waves.swiftStartWave
          ? balanceConfig.waves.swiftWeightBase + Math.floor(wave * balanceConfig.waves.swiftWeightPerWave)
          : 0,
        brute: wave >= balanceConfig.waves.bruteStartWave
          ? balanceConfig.waves.bruteWeightBase + Math.floor(wave * balanceConfig.waves.bruteWeightPerWave)
          : 0,
        orb: wave >= balanceConfig.waves.orbStartWave
          ? balanceConfig.waves.orbWeightBase + Math.floor(wave * balanceConfig.waves.orbWeightPerWave)
          : 0,
        boss: 0,
      },
    };
  });

export const waveConfigs = createWaveConfigs();
