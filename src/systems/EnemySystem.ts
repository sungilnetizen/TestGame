import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { Monster } from "../entities/Monster";
import type { WaveSystem } from "./WaveSystem";

export class EnemySystem {
  private monsters: Monster[] = [];
  private debugVisible = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly waveSystem: WaveSystem,
    private readonly onBossSpawn?: () => void,
  ) {}

  spawnMonsters(time: number): void {
    const spawns = this.waveSystem.createSpawns(time, this.monsters.length);

    for (const spawn of spawns) {
      const monster = new Monster(this.scene, spawn.x, spawn.y, {
        hp: spawn.hp,
        fallSpeed: spawn.fallSpeed,
        type: spawn.type,
        scoreValue: spawn.scoreValue,
        textureKey: spawn.textureKey,
      });
      monster.setDebugVisible(this.debugVisible);
      this.monsters.push(monster);

      if (spawn.type === "boss") {
        this.scene.cameras.main.shake(balanceConfig.boss.spawnShakeDuration, balanceConfig.boss.spawnShakeIntensity);
        this.onBossSpawn?.();
      }
    }
  }

  updateMonsters(delta: number): void {
    for (const monster of this.monsters) {
      monster.updateMonster(delta);
    }
  }

  getMonsters(): Monster[] {
    return this.monsters;
  }

  getMonsterCount(): number {
    return this.monsters.length;
  }

  includes(monster: Monster): boolean {
    return this.monsters.includes(monster);
  }

  removeMonster(monster: Monster): void {
    this.monsters = this.monsters.filter((candidate) => candidate !== monster);
    monster.destroy();
  }

  clear(): void {
    for (const monster of this.monsters) {
      monster.destroy();
    }

    this.monsters = [];
  }

  setDebugVisible(visible: boolean): void {
    this.debugVisible = visible;

    for (const monster of this.monsters) {
      monster.setDebugVisible(visible);
    }
  }
}
