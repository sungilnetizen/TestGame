import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { Monster } from "../entities/Monster";
import { Player } from "../entities/Player";
import { Hud } from "../ui/Hud";
import { TouchControls } from "../ui/TouchControls";
import { UpgradeStatusList } from "../ui/UpgradeStatusList";
import { UpgradeScreen } from "../ui/UpgradeScreen";
import { ControlAction, GameOverData } from "../types/GameTypes";
import { WaveSystem } from "../systems/WaveSystem";
import { RunRecordSystem } from "../systems/RunRecordSystem";
import { InputSystem } from "../systems/InputSystem";
import { EffectSystem } from "../systems/EffectSystem";
import { AttackSystem } from "../systems/AttackSystem";
import { BurstSystem } from "../systems/BurstSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { EnemySystem } from "../systems/EnemySystem";
import { GameStateSystem } from "../systems/GameStateSystem";
import { ScoreState, ScoreSystem } from "../systems/ScoreSystem";
import {
  defaultRunUpgradeState,
  RunUpgradeState,
  UpgradeDefinition,
  UpgradeSystem,
} from "../systems/UpgradeSystem";

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private hud!: Hud;
  private touchControls!: TouchControls;
  private upgradeStatusList!: UpgradeStatusList;
  private life = balanceConfig.run.startingLife;
  private inputSystem!: InputSystem;
  private effectSystem!: EffectSystem;
  private attackSystem!: AttackSystem;
  private enemySystem!: EnemySystem;
  private scoreSystem = new ScoreSystem();
  private burstSystem = new BurstSystem();
  private waveSystem = new WaveSystem();
  private upgradeSystem = new UpgradeSystem();
  private upgradeScreen!: UpgradeScreen;
  private upgradeState: RunUpgradeState = defaultRunUpgradeState();
  private selectedUpgrades: UpgradeDefinition[] = [];
  private runRecordSystem = new RunRecordSystem();
  private gameStateSystem = new GameStateSystem();

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.resetRunState();
    this.effectSystem = new EffectSystem(this);
    this.attackSystem = new AttackSystem(this);
    this.enemySystem = new EnemySystem(this, this.waveSystem);
    this.upgradeScreen = new UpgradeScreen(this, this.upgradeSystem);
    this.effectSystem.createBackdrop();
    this.player = new Player(this);
    this.hud = new Hud(this);
    this.inputSystem = new InputSystem(this, (action) => this.handleControl(action));
    this.touchControls = new TouchControls(this, (action) => this.handleControl(action));
    this.upgradeStatusList = new UpgradeStatusList(this, this.upgradeSystem.getAllUpgrades(), {
      x: 16,
      y: 106,
      columns: 1,
      maxItems: 4,
      compact: true,
    }).setDepth(900);
    this.upgradeStatusList.refresh(this.upgradeState);

    this.inputSystem.registerKeyboard();
  }

  update(time: number, delta: number): void {
    if (this.gameStateSystem.blocksGameplay()) return;

    this.player.updatePlayer(delta);

    this.enemySystem.spawnMonsters(time);
    this.enemySystem.updateMonsters(delta);

    this.resolvePlayerMonsterCollision();
    this.resolveDefenseLine();
    this.burstSystem.updateCooldownDisplay(time, this.upgradeState, (remainingMs, cooldownMs) => {
      this.touchControls.setBurstCooldown(remainingMs, cooldownMs);
    });
  }

  private handleControl(action: ControlAction): void {
    if (this.gameStateSystem.blocksGameplay()) return;

    if (action === "jump") {
      this.player.jump();
      return;
    }

    if (action === "attack") {
      this.attackSystem.tryAttack({
        player: this.player,
        getMonsters: () => this.enemySystem.getMonsters(),
        upgradeState: this.upgradeState,
        isGameBlocked: () => this.gameStateSystem.blocksGameplay(),
        damageMonster: (monster, damage, options) => this.damageMonster(monster, damage, options),
      });
      return;
    }

    this.burstSystem.tryBurst({
      time: this.time.now,
      monsters: this.enemySystem.getMonsters(),
      upgradeState: this.upgradeState,
      attackDamage: this.attackSystem.getAttackDamage(),
      setCooldownDisplay: (remainingMs, cooldownMs) => this.touchControls.setBurstCooldown(remainingMs, cooldownMs),
      createBurstEffect: () => this.effectSystem.createBurstEffect(this.player.x, this.player.y),
      shakeCamera: () => this.cameras.main.shake(180, 0.006),
      damageMonster: (monster, damage) => {
        this.damageMonster(monster, damage, {
          color: "#fff8df",
          combo: false,
          impact: false,
          critical: false,
        });
      },
    });
  }

  private resolvePlayerMonsterCollision(): void {
    for (const monster of this.enemySystem.getMonsters()) {
      if (CollisionSystem.playerHitsEnemy(this.player, monster)) {
      this.player.forceFall();
        this.resetCombo();
        return;
      }
    }
  }

  private resolveDefenseLine(): void {
    const didLoseLife = this.enemySystem.getMonsters().some(
      (monster) => CollisionSystem.enemyReachedBottom(monster),
    );

    if (didLoseLife) {
      this.life -= 1;
      const scoreState = this.scoreSystem.subtractScore(25);
      this.hud.setLife(this.life);
      this.hud.setScore(scoreState.score);
      this.resetCombo();
      this.clearMonsters();
      this.cameras.main.shake(160, 0.009);
    }

    if (this.life <= 0) {
      this.showGameOver();
    }
  }

  private recordMonsterKill(): void {
    const didAdvanceWave = this.waveSystem.recordKill();

    if (didAdvanceWave && !this.gameStateSystem.isUpgrade()) {
      this.hud.setWave(this.waveSystem.currentWaveNumber);
      this.effectSystem.createWaveAdvanceEffect(this.waveSystem.currentWaveNumber);
      this.showUpgradeChoices();
    }
  }

  private addComboScore(isKill: boolean): void {
    this.syncScoreHud(this.scoreSystem.addComboScore(isKill));
  }

  private resetCombo(): void {
    const previousCombo = this.scoreSystem.getCombo();
    const scoreState = this.scoreSystem.resetCombo();
    if (previousCombo === scoreState.combo) return;

    this.hud.setCombo(scoreState.combo);
  }

  private showUpgradeChoices(): void {
    this.gameStateSystem.enterUpgrade();
    this.upgradeScreen.show({
      state: this.upgradeState,
      onSelect: (upgrade) => this.selectUpgrade(upgrade),
    });
  }

  private selectUpgrade(upgrade: UpgradeDefinition): void {
    this.upgradeSystem.applyUpgrade(upgrade, this.upgradeState);
    this.selectedUpgrades.push(upgrade);
    this.upgradeStatusList.refresh(this.upgradeState);
    this.freezeMonstersAfterUpgrade();
    this.waveSystem.pauseSpawns(this.time.now, 220);
    this.gameStateSystem.resumePlaying();
    this.upgradeScreen.destroy();
  }

  private showGameOver(): void {
    if (this.gameStateSystem.isGameOver()) return;

    this.gameStateSystem.enterGameOver();
    this.upgradeScreen.destroy();
    this.clearMonsters();
    this.resetCombo();

    const records = this.runRecordSystem.saveRun(this.scoreSystem.getScore(), this.scoreSystem.getHighestCombo());
    const gameOverData: GameOverData = {
      score: this.scoreSystem.getScore(),
      wave: this.waveSystem.currentWaveNumber,
      highestCombo: this.scoreSystem.getHighestCombo(),
      bestScore: records.bestScore,
      bestCombo: records.bestCombo,
      upgrades: this.createSelectedUpgradeSummary(),
    };

    this.scene.start("GameOverScene", gameOverData);
  }

  private resetRunState(): void {
    this.life = balanceConfig.run.startingLife;
    this.scoreSystem.reset();
    this.attackSystem?.reset();
    this.burstSystem.reset();
    this.waveSystem.reset();
    this.upgradeState = defaultRunUpgradeState();
    this.selectedUpgrades = [];
    this.gameStateSystem.reset();
    this.clearMonsters();
  }

  private createSelectedUpgradeSummary(): string[] {
    return Object.entries(this.upgradeState)
      .filter(([, level]) => level > 0)
      .map(([id, level]) => {
        const upgrade = this.selectedUpgrades.find((candidate) => candidate.id === id);
        return `${upgrade?.category ?? "Upgrade"}: ${upgrade?.title ?? id} Lv ${level}`;
      });
  }

  private damageMonster(
    monster: Monster,
    damage: number,
    options: {
      color: string;
      combo: boolean;
      impact: boolean;
      critical?: boolean;
    },
  ): boolean {
    if (!this.enemySystem.includes(monster)) return false;

    const roundedDamage = Math.max(1, Math.round(damage));
    const isDefeated = monster.takeDamage(roundedDamage, { impact: options.impact });
    this.effectSystem.showDamageNumber(monster.x, monster.y - monster.radius, roundedDamage, options.color, options.critical);

    if (options.combo) {
      this.addComboScore(isDefeated);
    } else if (isDefeated) {
      this.hud.setScore(this.scoreSystem.addScore(monster.scoreValue).score);
    }

    if (isDefeated) {
      this.attackSystem.forgetMonster(monster);
      this.effectSystem.createMonsterDefeatEffect(monster.x, monster.y);
      if (options.combo) {
        this.hud.setScore(this.scoreSystem.addScore(monster.scoreValue - balanceConfig.combat.scorePerKill).score);
      }
      this.enemySystem.removeMonster(monster);
      this.recordMonsterKill();
    }

    return isDefeated;
  }

  private freezeMonstersAfterUpgrade(): void {
    for (const monster of this.enemySystem.getMonsters()) {
      monster.freeze({
        durationMs: 180,
        tintColor: 0x6fb7ff,
      });
    }
  }

  private clearMonsters(): void {
    this.attackSystem?.clearBurnTokens();
    this.enemySystem?.clear();
  }

  private syncScoreHud(scoreState: ScoreState): void {
    this.hud.setCombo(scoreState.combo);
    this.hud.setScore(scoreState.score);
  }

}
