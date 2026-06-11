import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { Monster } from "../entities/Monster";
import { Player } from "../entities/Player";
import { Hud } from "../ui/Hud";
import { TouchControls } from "../ui/TouchControls";
import { UpgradeStatusList } from "../ui/UpgradeStatusList";
import { UpgradeScreen } from "../ui/UpgradeScreen";
import { TitleScreen } from "../ui/TitleScreen";
import { PauseMenu } from "../ui/PauseMenu";
import { ShopScreen } from "../ui/ShopScreen";
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
import { SoundSystem } from "../systems/SoundSystem";
import { AssetLoader } from "../systems/AssetLoader";
import { IMAGE_ASSETS, SOUND_ASSETS } from "../assets/AssetManifest";
import {
  defaultRunUpgradeState,
  RunUpgradeState,
  UpgradeDefinition,
  UpgradeSystem,
} from "../systems/UpgradeSystem";

type GameSceneData = {
  autoStart?: boolean;
};

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
  private titleScreen!: TitleScreen;
  private pauseMenu!: PauseMenu;
  private shopScreen!: ShopScreen;
  private soundSystem!: SoundSystem;
  private upgradeState: RunUpgradeState = defaultRunUpgradeState();
  private selectedUpgrades: UpgradeDefinition[] = [];
  private runRecordSystem = new RunRecordSystem();
  private gameStateSystem = new GameStateSystem();
  private shopReturnTarget: "title" | "pause" = "title";
  private pauseButton?: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
  private pauseButtonText?: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  preload(): void {
    AssetLoader.preload(this);
  }

  create(data: GameSceneData = {}): void {
    this.soundSystem = new SoundSystem(this);
    this.effectSystem = new EffectSystem(this);
    this.attackSystem = new AttackSystem(this);
    this.enemySystem = new EnemySystem(this, this.waveSystem);
    this.upgradeScreen = new UpgradeScreen(this, this.upgradeSystem);
    this.titleScreen = new TitleScreen(this);
    this.pauseMenu = new PauseMenu(this);
    this.shopScreen = new ShopScreen(this);
    this.effectSystem.createBackdrop();
    this.player = new Player(this);
    this.hud = new Hud(this);
    this.inputSystem = new InputSystem(
      this,
      (action) => this.handleControl(action),
      () => this.togglePause(),
    );
    this.touchControls = new TouchControls(this, (action) => this.handleControl(action));
    this.upgradeStatusList = new UpgradeStatusList(this, this.upgradeSystem.getAllUpgrades(), {
      x: 16,
      y: 106,
      columns: 1,
      maxItems: 4,
      compact: true,
    }).setDepth(900);
    this.upgradeStatusList.refresh(this.upgradeState);
    this.createPauseButton();

    this.inputSystem.registerKeyboard();

    if (data.autoStart) {
      this.startNewGame();
      return;
    }

    this.resetRunState();
    this.showTitleScreen();
  }

  update(time: number, delta: number): void {
    if (this.gameStateSystem.blocksGameplay()) return;

    this.player.updatePlayer(delta);
    this.effectSystem.updateBackdropForPlayer(this.player.y, delta, this.player.isGrounded());

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
      this.soundSystem.playSfx(SOUND_ASSETS.ATTACK.key);
      this.attackSystem.tryAttack({
        player: this.player,
        getMonsters: () => this.enemySystem.getMonsters(),
        upgradeState: this.upgradeState,
        isGameBlocked: () => this.gameStateSystem.blocksGameplay(),
        damageMonster: (monster, damage, options) => this.damageMonster(monster, damage, options),
      });
      return;
    }

    this.soundSystem.playSfx(SOUND_ASSETS.BURST.key);
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

  private createPauseButton(): void {
    this.pauseButton = this.createPauseButtonBody();

    this.pauseButton.on("pointerdown", () => this.pauseGame());
    this.setPauseButtonVisible(false);
  }

  private createPauseButtonBody(): Phaser.GameObjects.Arc | Phaser.GameObjects.Image {
    const x = 346;
    const y = 48;
    const radius = 23;

    if (this.textures.exists(IMAGE_ASSETS.BUTTON_PAUSE.key)) {
      return this.add
        .image(x, y, IMAGE_ASSETS.BUTTON_PAUSE.key)
        .setDisplaySize(radius * 2, radius * 2)
        .setInteractive({ useHandCursor: true })
        .setDepth(950);
    }

    const fallbackButton = this.add
      .circle(x, y, radius, 0x38475c, 0.92)
      .setStrokeStyle(2, 0xf4efe2, 0.72)
      .setInteractive({ useHandCursor: true })
      .setDepth(950);

    this.pauseButtonText = this.add
      .text(x, y, "Pause", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#fff8df",
        stroke: "#1d1720",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(951);

    return fallbackButton;
  }

  private startNewGame(): void {
    this.titleScreen.destroy();
    this.pauseMenu.destroy();
    this.shopScreen.destroy();
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.soundSystem.playBgm(SOUND_ASSETS.BGM_BATTLE.key);
    this.resetRunState();
    this.gameStateSystem.enterPlaying();
    this.setPauseButtonVisible(true);
  }

  private showTitleScreen(): void {
    const records = this.runRecordSystem.getRecords();
    this.gameStateSystem.enterTitle();
    this.soundSystem.stopBgm();
    this.setPauseButtonVisible(false);
    this.pauseMenu.destroy();
    this.shopScreen.destroy();
    this.titleScreen.show({
      bestScore: records.bestScore,
      bestCombo: records.bestCombo,
      soundEnabled: this.soundSystem.isEnabled(),
      onStart: () => this.startNewGame(),
      onOpenShop: () => this.openShopFromTitle(),
      onToggleSound: () => this.toggleSound(),
    });
  }

  private togglePause(): void {
    if (this.gameStateSystem.isPaused()) {
      this.resumeGame();
      return;
    }

    this.pauseGame();
  }

  private pauseGame(): void {
    if (!this.gameStateSystem.canPause()) return;

    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.gameStateSystem.enterPaused();
    this.setPauseButtonVisible(false);
    this.pauseMenu.show({
      soundEnabled: this.soundSystem.isEnabled(),
      onResume: () => this.resumeGame(),
      onToggleSound: () => this.toggleSound(),
      onOpenShop: () => this.openShopFromPause(),
      onRestart: () => this.startNewGame(),
      onQuitToTitle: () => this.quitToTitle(),
    });
  }

  private resumeGame(): void {
    if (!this.gameStateSystem.isPaused()) return;

    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.pauseMenu.destroy();
    this.gameStateSystem.resumePlaying();
    this.setPauseButtonVisible(true);
  }

  private openShopFromTitle(): void {
    if (!this.gameStateSystem.isTitle()) return;

    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.shopReturnTarget = "title";
    this.titleScreen.destroy();
    this.gameStateSystem.enterShop();
    this.showShop();
  }

  private openShopFromPause(): void {
    if (!this.gameStateSystem.isPaused()) return;

    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.shopReturnTarget = "pause";
    this.pauseMenu.destroy();
    this.gameStateSystem.enterShop();
    this.showShop();
  }

  private showShop(): void {
    this.shopScreen.show({
      gold: 0,
      onBack: () => this.closeShop(),
    });
  }

  private closeShop(): void {
    this.shopScreen.destroy();
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);

    if (this.shopReturnTarget === "pause") {
      this.gameStateSystem.enterPausedFromShop();
      this.pauseMenu.show({
        soundEnabled: this.soundSystem.isEnabled(),
        onResume: () => this.resumeGame(),
        onToggleSound: () => this.toggleSound(),
        onOpenShop: () => this.openShopFromPause(),
        onRestart: () => this.startNewGame(),
        onQuitToTitle: () => this.quitToTitle(),
      });
      return;
    }

    this.showTitleScreen();
  }

  private toggleSound(): void {
    const enabled = this.soundSystem.toggle();
    this.titleScreen.setSoundEnabled(enabled);
    this.pauseMenu.setSoundEnabled(enabled);
  }

  private quitToTitle(): void {
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.soundSystem.stopBgm();
    this.pauseMenu.destroy();
    this.shopScreen.destroy();
    this.resetRunState();
    this.showTitleScreen();
  }

  private setPauseButtonVisible(visible: boolean): void {
    this.pauseButton?.setVisible(visible);
    this.pauseButtonText?.setVisible(visible);
  }

  private resolvePlayerMonsterCollision(): void {
    for (const monster of this.enemySystem.getMonsters()) {
      if (CollisionSystem.groundedPlayerHitsEnemy(this.player, monster)) {
        this.loseLifeFromEnemy();
        return;
      }

      if (CollisionSystem.playerHitsEnemy(this.player, monster)) {
        this.player.forceFall();
        this.resetCombo();
        return;
      }
    }
  }

  private resolveDefenseLine(): void {
    const didLoseLife = this.enemySystem.getMonsters().some(
      (monster) => CollisionSystem.enemyReachedBottom(monster, this.effectSystem.getDefenseLineY()),
    );

    if (didLoseLife) {
      this.loseLifeFromEnemy();
    }

    if (this.life <= 0) {
      this.showGameOver();
    }
  }

  private loseLifeFromEnemy(): void {
    this.life -= 1;
    this.player.flashHit();
    const scoreState = this.scoreSystem.subtractScore(25);
    this.hud.setLife(this.life);
    this.hud.setScore(scoreState.score);
    this.resetCombo();
    this.clearMonsters();
    this.cameras.main.shake(160, 0.009);
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
    this.setPauseButtonVisible(false);
    this.upgradeScreen.show({
      state: this.upgradeState,
      onSelect: (upgrade) => this.selectUpgrade(upgrade),
    });
  }

  private selectUpgrade(upgrade: UpgradeDefinition): void {
    this.upgradeSystem.applyUpgrade(upgrade, this.upgradeState);
    this.soundSystem.playSfx(SOUND_ASSETS.UPGRADE_SELECT.key);
    this.selectedUpgrades.push(upgrade);
    this.upgradeStatusList.refresh(this.upgradeState);
    this.freezeMonstersAfterUpgrade();
    this.waveSystem.pauseSpawns(this.time.now, 220);
    this.gameStateSystem.resumePlaying();
    this.upgradeScreen.destroy();
    this.setPauseButtonVisible(true);
  }

  private showGameOver(): void {
    if (this.gameStateSystem.isGameOver()) return;

    this.gameStateSystem.enterGameOver();
    this.soundSystem.playSfx(SOUND_ASSETS.GAMEOVER.key);
    this.soundSystem.stopBgm();
    this.setPauseButtonVisible(false);
    this.pauseMenu.destroy();
    this.shopScreen.destroy();
    this.titleScreen.destroy();
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
    this.hud?.setLife(this.life);
    this.hud?.setScore(0);
    this.hud?.setWave(1);
    this.hud?.setCombo(0);
    this.upgradeStatusList?.refresh(this.upgradeState);
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
      this.soundSystem.playSfx(SOUND_ASSETS.HIT.key);
    } else if (isDefeated) {
      this.hud.setScore(this.scoreSystem.addScore(monster.scoreValue).score);
    }

    if (isDefeated) {
      this.attackSystem.forgetMonster(monster);
      this.soundSystem.playSfx(SOUND_ASSETS.KILL.key);
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
