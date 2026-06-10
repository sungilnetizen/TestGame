import Phaser from "phaser";
import { Monster } from "../entities/Monster";
import type { WaveSystem } from "./WaveSystem";

export class EnemySystem {
  private monsters: Monster[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly waveSystem: WaveSystem,
  ) {}

  spawnMonsters(time: number): void {
    const spawns = this.waveSystem.createSpawns(time, this.monsters.length);

    for (const spawn of spawns) {
      const monster = new Monster(this.scene, spawn.x, spawn.y, {
        hp: spawn.hp,
        fallSpeed: spawn.fallSpeed,
        type: spawn.type,
      });
      this.monsters.push(monster);
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
}
