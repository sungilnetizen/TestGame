import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { enemyDefinitions, type EnemyType } from "../data/enemies";
import { waveConfigs } from "../data/waves";

export type MonsterType = EnemyType;

export type MonsterSpawn = {
  x: number;
  y: number;
  hp: number;
  fallSpeed: number;
  type: MonsterType;
};

export class WaveSystem {
  private waveIndex = 0;
  private killsInWave = 0;
  private lastSpawnAt = -Infinity;
  private spawnPausedUntil = -Infinity;

  get currentWaveNumber(): number {
    return this.currentWave.wave;
  }

  createSpawns(time: number, aliveCount: number): MonsterSpawn[] {
    const wave = this.currentWave;

    if (
      aliveCount >= wave.maxAlive ||
      time < this.spawnPausedUntil ||
      time - this.lastSpawnAt < wave.spawnInterval
    ) {
      return [];
    }

    this.lastSpawnAt = time;
    const spawnCount = Math.min(
      Phaser.Math.Between(wave.groupMin, wave.groupMax),
      wave.maxAlive - aliveCount,
    );
    const centerX = Phaser.Math.Between(balanceConfig.monster.spawnMinX, balanceConfig.monster.spawnMaxX);
    const spawns: MonsterSpawn[] = [];

    for (let i = 0; i < spawnCount; i += 1) {
      const centeredIndex = i - (spawnCount - 1) / 2;
      const spreadOffset = spawnCount === 1 ? 0 : centeredIndex * wave.groupSpread;
      const jitter = Phaser.Math.Between(-10, 10);
      const monsterType = this.pickMonsterType();
      const typeConfig = enemyDefinitions[monsterType];
      const x = Phaser.Math.Clamp(
        centerX + spreadOffset + jitter,
        balanceConfig.monster.spawnMinX,
        balanceConfig.monster.spawnMaxX,
      );

      spawns.push({
        x,
        y: 86 - i * 18,
        hp: Math.round(wave.monsterHp * typeConfig.hpMultiplier),
        fallSpeed: wave.fallSpeed * typeConfig.speedMultiplier,
        type: monsterType,
      });
    }

    return spawns;
  }

  recordKill(): boolean {
    const previousWave = this.currentWaveNumber;
    this.killsInWave += 1;

    while (this.killsInWave >= this.currentWave.killsToNext && this.waveIndex < waveConfigs.length - 1) {
      this.killsInWave -= this.currentWave.killsToNext;
      this.waveIndex += 1;
      this.lastSpawnAt = -Infinity;
    }

    return this.currentWaveNumber !== previousWave;
  }

  reset(): void {
    this.waveIndex = 0;
    this.killsInWave = 0;
    this.lastSpawnAt = -Infinity;
    this.spawnPausedUntil = -Infinity;
  }

  pauseSpawns(time: number, durationMs: number): void {
    this.spawnPausedUntil = Math.max(this.spawnPausedUntil, time + durationMs);
  }

  private get currentWave() {
    return waveConfigs[this.waveIndex];
  }

  private pickMonsterType(): MonsterType {
    const weights = this.currentWave.monsterWeights;
    const entries = Object.entries(weights) as Array<[MonsterType, number]>;
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Phaser.Math.FloatBetween(0, totalWeight);

    for (const [type, weight] of entries) {
      roll -= weight;

      if (roll <= 0) {
        return type;
      }
    }

    return "normal";
  }
}
