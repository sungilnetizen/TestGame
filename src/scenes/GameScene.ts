import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { Monster } from "../entities/Monster";
import { Player } from "../entities/Player";
import { Hud } from "../ui/Hud";
import { TouchControls } from "../ui/TouchControls";
import { UpgradeStatusList } from "../ui/UpgradeStatusList";
import { UpgradeScreen } from "../ui/UpgradeScreen";
import { PauseMenu } from "../ui/PauseMenu";
import { ControlAction } from "../types/GameTypes";
import { WaveSystem } from "../systems/WaveSystem";
import { RunRecordSystem } from "../systems/RunRecordSystem";
import { InputSystem } from "../systems/InputSystem";
import { EffectSystem } from "../systems/EffectSystem";
import { AttackSystem } from "../systems/AttackSystem";
import { BurstSystem } from "../systems/BurstSystem";
import { CombatResolutionSystem } from "../systems/CombatResolutionSystem";
import { EnemySystem } from "../systems/EnemySystem";
import { GameStateSystem } from "../systems/GameStateSystem";
import { PlayerDamageSystem } from "../systems/PlayerDamageSystem";
import { RunEndSystem } from "../systems/RunEndSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { SoundSystem } from "../systems/SoundSystem";
import { AssetLoader } from "../systems/AssetLoader";
import { IMAGE_ASSETS, SOUND_ASSETS } from "../assets/AssetManifest";
import { RunConfigSystem } from "../systems/RunConfigSystem";
import { UpgradeFlowSystem } from "../systems/UpgradeFlowSystem";
import {
  defaultRunUpgradeState,
  maxUpgradeLevel,
  RunUpgradeState,
  UpgradeSystem,
} from "../systems/UpgradeSystem";
import type { GameRunConfig, GameRunStartData } from "../types/GameRunTypes";

type GameSceneData = GameRunStartData;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private hud!: Hud;
  private touchControls!: TouchControls;
  private upgradeStatusList!: UpgradeStatusList;
  private inputSystem!: InputSystem;
  private effectSystem!: EffectSystem;
  private attackSystem!: AttackSystem;
  private combatResolutionSystem!: CombatResolutionSystem;
  private enemySystem!: EnemySystem;
  private playerDamageSystem!: PlayerDamageSystem;
  private scoreSystem = new ScoreSystem();
  private burstSystem = new BurstSystem();
  private waveSystem = new WaveSystem();
  private upgradeSystem = new UpgradeSystem();
  private upgradeFlowSystem!: UpgradeFlowSystem;
  private runEndSystem!: RunEndSystem;
  private upgradeScreen!: UpgradeScreen;
  private pauseMenu!: PauseMenu;
  private soundSystem!: SoundSystem;
  private upgradeState: RunUpgradeState = defaultRunUpgradeState();
  private runRecordSystem = new RunRecordSystem();
  private gameStateSystem = new GameStateSystem();
  private runConfig!: GameRunConfig;
  private debugVisible = true;
  private pauseButton?: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
  private pauseButtonText?: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  preload(): void {
    AssetLoader.preload(this);
  }

  create(data: GameSceneData = {}): void {
    this.runConfig = RunConfigSystem.create(data);
    this.soundSystem = new SoundSystem(this);
    this.effectSystem = new EffectSystem(this);
    this.attackSystem = new AttackSystem(this);
    this.waveSystem.configure(this.runConfig);
    this.enemySystem = new EnemySystem(this, this.waveSystem);
    this.upgradeScreen = new UpgradeScreen(this, this.upgradeSystem);
    this.pauseMenu = new PauseMenu(this);
    this.effectSystem.createBackdrop();
    this.player = new Player(this);
    this.hud = new Hud(this);
    this.playerDamageSystem = new PlayerDamageSystem({
      scene: this,
      player: this.player,
      enemySystem: this.enemySystem,
      effectSystem: this.effectSystem,
      scoreSystem: this.scoreSystem,
      waveSystem: this.waveSystem,
      setLife: (life) => this.hud.setLife(life),
      setScore: (score) => this.hud.setScore(score),
      setCombo: (combo) => this.hud.setCombo(combo),
      clearMonsters: () => this.clearMonsters(),
    });
    this.combatResolutionSystem = new CombatResolutionSystem({
      enemySystem: this.enemySystem,
      effectSystem: this.effectSystem,
      scoreSystem: this.scoreSystem,
      soundSystem: this.soundSystem,
      attackSystem: this.attackSystem,
      setScore: (score) => this.hud.setScore(score),
      setCombo: (combo) => this.hud.setCombo(combo),
      onMonsterKilled: (monster) => this.recordMonsterKill(monster),
    });
    this.inputSystem = new InputSystem(
      this,
      (action) => this.handleControl(action),
      () => this.togglePause(),
      () => this.toggleDebugVisible(),
      () => this.jumpToNextBossWave(),
      () => this.increaseLightningSwordDebug(),
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
    this.upgradeFlowSystem = new UpgradeFlowSystem({
      scene: this,
      upgradeSystem: this.upgradeSystem,
      upgradeScreen: this.upgradeScreen,
      upgradeStatusList: this.upgradeStatusList,
      gameStateSystem: this.gameStateSystem,
      soundSystem: this.soundSystem,
      waveSystem: this.waveSystem,
      getMonsters: () => this.enemySystem.getMonsters(),
      setPauseButtonVisible: (visible) => this.setPauseButtonVisible(visible),
    });
    this.runEndSystem = new RunEndSystem({
      scene: this,
      gameStateSystem: this.gameStateSystem,
      soundSystem: this.soundSystem,
      pauseMenu: this.pauseMenu,
      upgradeScreen: this.upgradeScreen,
      scoreSystem: this.scoreSystem,
      waveSystem: this.waveSystem,
      runRecordSystem: this.runRecordSystem,
      runConfig: this.runConfig,
      setPauseButtonVisible: (visible) => this.setPauseButtonVisible(visible),
      clearMonsters: () => this.clearMonsters(),
      resetCombo: () => this.resetCombo(),
      createSelectedUpgradeSummary: () => this.upgradeFlowSystem.createSelectedUpgradeSummary(this.upgradeState),
    });
    this.createPauseButton();
    this.applyDebugVisible();

    this.inputSystem.registerKeyboard();
    this.startNewGame();
  }

  update(time: number, delta: number): void {
    if (this.gameStateSystem.blocksGameplay()) return;

    this.player.updatePlayer(delta);
    this.effectSystem.updateBackdropForPlayer(this.player.y, delta, this.player.isGrounded());

    this.enemySystem.spawnMonsters(time);
    this.enemySystem.updateMonsters(delta);

    if (this.playerDamageSystem.resolve()) {
      this.showGameOver();
      return;
    }

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
        damageMonster: (monster, damage, options) => this.combatResolutionSystem.damageMonster(monster, damage, options),
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
      shakeCamera: () => this.cameras.main.shake(balanceConfig.burst.cameraShakeDuration, balanceConfig.burst.cameraShakeIntensity),
      damageMonster: (monster, damage) => {
        this.combatResolutionSystem.damageMonster(monster, damage, {
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
    this.pauseMenu.destroy();
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.soundSystem.playBgm(SOUND_ASSETS.BGM_BATTLE.key);
    this.resetRunState();
    this.gameStateSystem.enterPlaying();
    this.setPauseButtonVisible(true);
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
      onReturnLobby: () => this.returnToLobby(),
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

  private toggleSound(): void {
    this.pauseMenu.setSoundEnabled(this.soundSystem.toggle());
  }

  private quitToTitle(): void {
    this.returnToLobby();
  }

  private returnToLobby(): void {
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.soundSystem.stopBgm();
    this.pauseMenu.destroy();
    this.resetRunState();
    this.scene.start("LobbyScene");
  }

  private setPauseButtonVisible(visible: boolean): void {
    this.pauseButton?.setVisible(visible);
    this.pauseButtonText?.setVisible(visible);
  }

  private toggleDebugVisible(): void {
    this.debugVisible = !this.debugVisible;
    this.applyDebugVisible();
  }

  private applyDebugVisible(): void {
    this.player?.setDebugVisible(this.debugVisible);
    this.enemySystem?.setDebugVisible(this.debugVisible);
    this.effectSystem?.setDebugVisible(this.debugVisible);
    this.attackSystem?.setDebugVisible(this.debugVisible);
  }

  private jumpToNextBossWave(): void {
    if (this.gameStateSystem.blocksGameplay()) return;

    const currentWave = this.waveSystem.currentWaveNumber;
    const nextBossWave = this.runConfig.modeDefinition.bossWaveRule === "stage-final"
      ? this.runConfig.maxWave ?? currentWave
      : this.getNextIntervalBossWave(currentWave);

    this.clearMonsters();
    this.waveSystem.jumpToWave(nextBossWave);
    this.hud.setWave(this.waveSystem.currentWaveNumber);
    this.effectSystem.createWaveAdvanceEffect(this.waveSystem.currentWaveNumber);
  }

  private increaseLightningSwordDebug(): void {
    if (this.gameStateSystem.blocksGameplay()) return;

    const nextLevel = Math.min(maxUpgradeLevel, this.upgradeState.lightningSword + 1);
    if (nextLevel === this.upgradeState.lightningSword) return;

    this.upgradeState.lightningSword = nextLevel;
    this.upgradeStatusList.refresh(this.upgradeState);
  }

  private getNextIntervalBossWave(currentWave: number): number {
    const interval = balanceConfig.boss.waveInterval;

    return Math.min(
      balanceConfig.waves.count,
      Math.max(interval, (Math.floor(currentWave / interval) + 1) * interval),
    );
  }

  private recordMonsterKill(monster: Monster): void {
    const didAdvanceWave = this.waveSystem.recordMonsterKill(monster.type);

    if (this.waveSystem.isComplete) {
      this.showGameClear();
      return;
    }

    if (didAdvanceWave && !this.gameStateSystem.isUpgrade()) {
      this.hud.setWave(this.waveSystem.currentWaveNumber);
      this.effectSystem.createWaveAdvanceEffect(this.waveSystem.currentWaveNumber);
      this.upgradeFlowSystem.showChoices(this.upgradeState);
    }
  }

  private resetCombo(): void {
    const previousCombo = this.scoreSystem.getCombo();
    const scoreState = this.scoreSystem.resetCombo();
    if (previousCombo === scoreState.combo) return;

    this.hud.setCombo(scoreState.combo);
  }

  private showGameOver(): void {
    this.runEndSystem.finish("gameover");
  }

  private showGameClear(): void {
    this.runEndSystem.finish("clear");
  }

  private resetRunState(): void {
    this.scoreSystem.reset();
    this.attackSystem?.reset();
    this.burstSystem.reset();
    this.playerDamageSystem?.reset();
    this.waveSystem.reset();
    this.upgradeState = defaultRunUpgradeState();
    this.gameStateSystem.reset();
    this.clearMonsters();
    this.hud?.setScore(0);
    this.hud?.setWave(1);
    this.hud?.setCombo(0);
    this.upgradeFlowSystem?.reset(this.upgradeState);
  }

  private clearMonsters(): void {
    this.attackSystem?.clearBurnTokens();
    this.enemySystem?.clear();
  }

}
