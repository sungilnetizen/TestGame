import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { enemyDefinitions, type EnemyType } from "../data/enemies";
import { waveConfigs } from "../data/waves";
import type { GameRunConfig } from "../types/GameRunTypes";

export type MonsterType = EnemyType;

export type MonsterSpawn = {
  x: number;
  y: number;
  hp: number;
  fallSpeed: number;
  type: MonsterType;
  scoreValue?: number;
  textureKey?: string;
};

export class WaveSystem {
  private waveIndex = 0;
  private killsInWave = 0;
  private lastSpawnAt = -Infinity;
  private spawnPausedUntil = -Infinity;
  private bossSpawned = false;
  private bossDefeated = false;
  private runConfig?: GameRunConfig;

  get currentWaveNumber(): number {
    return this.currentWave.wave;
  }

  get isComplete(): boolean {
    return Boolean(this.runConfig?.maxWave && this.currentWaveNumber >= this.runConfig.maxWave && this.bossDefeated);
  }

  configure(runConfig: GameRunConfig): void {
    this.runConfig = runConfig;
    this.reset();
  }

  createSpawns(time: number, aliveCount: number): MonsterSpawn[] {
    const wave = this.currentWave;

    if (time >= this.spawnPausedUntil && this.isBossWave() && !this.bossSpawned) {
      this.bossSpawned = true;
      this.lastSpawnAt = time;
      return [this.createBossSpawn(wave.fallSpeed)];
    }

    if (this.isBossWave()) {
      return [];
    }

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
      const jitter = Phaser.Math.Between(balanceConfig.waves.spawnJitterMin, balanceConfig.waves.spawnJitterMax);
      const monsterType = this.pickMonsterType();
      const typeConfig = enemyDefinitions[monsterType];
      const x = Phaser.Math.Clamp(
        centerX + spreadOffset + jitter,
        balanceConfig.monster.spawnMinX,
        balanceConfig.monster.spawnMaxX,
      );

      spawns.push({
        x,
        y: balanceConfig.waves.spawnStartY - i * balanceConfig.waves.spawnStackSpacing,
        hp: Math.round(wave.monsterHp * typeConfig.hpMultiplier * (this.runConfig?.difficultyMultiplier ?? 1)),
        fallSpeed: wave.fallSpeed * typeConfig.speedMultiplier * Math.sqrt(this.runConfig?.difficultyMultiplier ?? 1),
        type: monsterType,
      });
    }

    return spawns;
  }

  recordKill(): boolean {
    const previousWave = this.currentWaveNumber;
    this.killsInWave += 1;

    return this.tryAdvanceWave(previousWave);
  }

  recordMonsterKill(type: MonsterType): boolean {
    if (type === "boss") {
      this.bossDefeated = true;
    }

    return this.recordKill();
  }

  releaseBoss(): void {
    if (!this.isBossWave() || this.bossDefeated) return;

    this.bossSpawned = false;
  }

  isBossWave(waveNumber = this.currentWaveNumber): boolean {
    if (this.runConfig?.modeDefinition.bossWaveRule === "stage-final") {
      return waveNumber === this.runConfig.maxWave;
    }

    return waveNumber % balanceConfig.boss.waveInterval === 0;
  }

  private tryAdvanceWave(previousWave: number): boolean {
    while (this.waveIndex < this.getMaxWaveIndex()) {
      const isBossWave = this.isBossWave();
      const canAdvance = isBossWave
        ? this.bossDefeated
        : this.killsInWave >= this.currentWave.killsToNext;

      if (!canAdvance) {
        break;
      }

      this.killsInWave = isBossWave ? 0 : this.killsInWave - this.currentWave.killsToNext;
      this.waveIndex += 1;
      this.lastSpawnAt = -Infinity;
      this.bossSpawned = false;
      this.bossDefeated = false;
    }

    return this.currentWaveNumber !== previousWave;
  }

  reset(): void {
    this.waveIndex = 0;
    this.killsInWave = 0;
    this.lastSpawnAt = -Infinity;
    this.spawnPausedUntil = -Infinity;
    this.bossSpawned = false;
    this.bossDefeated = false;
  }

  jumpToWave(waveNumber: number): void {
    const targetIndex = Phaser.Math.Clamp(Math.floor(waveNumber) - 1, 0, this.getMaxWaveIndex());
    this.waveIndex = targetIndex;
    this.killsInWave = 0;
    this.lastSpawnAt = -Infinity;
    this.spawnPausedUntil = -Infinity;
    this.bossSpawned = false;
    this.bossDefeated = false;
  }

  pauseSpawns(time: number, durationMs: number): void {
    this.spawnPausedUntil = Math.max(this.spawnPausedUntil, time + durationMs);
  }

  private get currentWave() {
    return waveConfigs[this.waveIndex];
  }

  private getMaxWaveIndex(): number {
    const maxWave = this.runConfig?.maxWave ?? waveConfigs.length;
    return Phaser.Math.Clamp(maxWave - 1, 0, waveConfigs.length - 1);
  }

  private createBossSpawn(fallSpeed: number): MonsterSpawn {
    const bossWaveIndex = Math.max(0, Math.floor(this.currentWaveNumber / balanceConfig.boss.waveInterval) - 1);
    const difficultyMultiplier = this.runConfig?.difficultyMultiplier ?? 1;
    const bossHp = Math.round(
      balanceConfig.boss.baseHp *
        difficultyMultiplier *
        (1 + bossWaveIndex * balanceConfig.boss.hpMultiplierPerBossWave),
    );
    const typeConfig = enemyDefinitions.boss;

    return {
      x: balanceConfig.boss.spawnX,
      y: balanceConfig.boss.spawnY,
      hp: bossHp,
      fallSpeed: fallSpeed * typeConfig.speedMultiplier,
      type: "boss",
      textureKey: this.getBossTextureKey(),
      scoreValue: balanceConfig.boss.baseScore + this.currentWaveNumber * balanceConfig.boss.scorePerWave,
    };
  }

  private getBossTextureKey(): string {
    if (this.runConfig?.modeDefinition.bossWaveRule === "stage-final") {
      return this.runConfig.stage.bossAssetKey;
    }

    if (this.currentWaveNumber <= balanceConfig.boss.waveInterval) {
      return enemyDefinitions.boss.assetKey;
    }

    return `enemy_boss_wave_${this.currentWaveNumber}`;
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
