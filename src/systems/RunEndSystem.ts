import Phaser from "phaser";
import type { GameOverData } from "../types/GameTypes";
import type { GameRunConfig } from "../types/GameRunTypes";
import { ProgressionSystem, type RunResult } from "./ProgressionSystem";
import type { GameStateSystem } from "./GameStateSystem";
import type { PauseMenu } from "../ui/PauseMenu";
import type { RunRecordSystem } from "./RunRecordSystem";
import type { ScoreSystem } from "./ScoreSystem";
import type { SoundSystem } from "./SoundSystem";
import type { UpgradeScreen } from "../ui/UpgradeScreen";
import type { WaveSystem } from "./WaveSystem";
import { SOUND_ASSETS } from "../assets/AssetManifest";

type RunEndSystemOptions = {
  scene: Phaser.Scene;
  gameStateSystem: GameStateSystem;
  soundSystem: SoundSystem;
  pauseMenu: PauseMenu;
  upgradeScreen: UpgradeScreen;
  scoreSystem: ScoreSystem;
  waveSystem: WaveSystem;
  runRecordSystem: RunRecordSystem;
  runConfig: GameRunConfig;
  setPauseButtonVisible: (visible: boolean) => void;
  clearMonsters: () => void;
  resetCombo: () => void;
  createSelectedUpgradeSummary: () => string[];
  getEarnedGold: () => number;
};

export class RunEndSystem {
  constructor(private readonly options: RunEndSystemOptions) {}

  finish(result: RunResult): void {
    if (this.options.gameStateSystem.isGameOver()) return;

    this.options.gameStateSystem.enterGameOver();
    if (result === "gameover") {
      this.options.soundSystem.playSfx(SOUND_ASSETS.GAMEOVER.key);
    } else {
      this.options.soundSystem.playSfx(SOUND_ASSETS.GAMECLEAR.key);
    }
    this.options.soundSystem.stopBgm();
    this.options.setPauseButtonVisible(false);
    this.options.pauseMenu.destroy();
    this.options.upgradeScreen.destroy();
    this.options.clearMonsters();
    this.options.resetCombo();

    const score = this.options.scoreSystem.getScore();
    const highestCombo = this.options.scoreSystem.getHighestCombo();
    const records = this.options.runRecordSystem.saveRun(score, highestCombo);
    const progressionResult = ProgressionSystem.finishRun(
      this.options.runConfig,
      result,
      score,
      this.options.getEarnedGold(),
    );
    const gameOverData: GameOverData = {
      score,
      gold: progressionResult.gold,
      wave: this.options.waveSystem.currentWaveNumber,
      highestCombo,
      bestScore: records.bestScore,
      bestCombo: records.bestCombo,
      result,
      mode: this.options.runConfig.mode,
      stageName: this.options.runConfig.stage.name,
      upgrades: this.options.createSelectedUpgradeSummary(),
      unlockMessages: progressionResult.unlockMessages,
    };

    this.options.scene.scene.start("GameOverScene", gameOverData);
  }
}
