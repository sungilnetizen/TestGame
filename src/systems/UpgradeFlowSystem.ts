import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { SOUND_ASSETS } from "../assets/AssetManifest";
import type { Monster } from "../entities/Monster";
import type { GameStateSystem } from "./GameStateSystem";
import type { RunUpgradeState, UpgradeDefinition, UpgradeSystem } from "./UpgradeSystem";
import type { SoundSystem } from "./SoundSystem";
import type { UpgradeScreen } from "../ui/UpgradeScreen";
import type { UpgradeStatusList } from "../ui/UpgradeStatusList";
import type { WaveSystem } from "./WaveSystem";

type UpgradeFlowSystemOptions = {
  scene: Phaser.Scene;
  upgradeSystem: UpgradeSystem;
  upgradeScreen: UpgradeScreen;
  upgradeStatusList: UpgradeStatusList;
  gameStateSystem: GameStateSystem;
  soundSystem: SoundSystem;
  waveSystem: WaveSystem;
  getMonsters: () => Monster[];
  setPauseButtonVisible: (visible: boolean) => void;
};

export class UpgradeFlowSystem {
  private readonly selectedUpgrades: UpgradeDefinition[] = [];

  constructor(private readonly options: UpgradeFlowSystemOptions) {}

  showChoices(state: RunUpgradeState): void {
    this.options.gameStateSystem.enterUpgrade();
    this.options.setPauseButtonVisible(false);
    this.options.upgradeScreen.show({
      state,
      onSelect: (upgrade) => this.selectUpgrade(upgrade, state),
    });
  }

  reset(state: RunUpgradeState): void {
    this.selectedUpgrades.length = 0;
    this.options.upgradeScreen.destroy();
    this.options.upgradeStatusList.refresh(state);
  }

  createSelectedUpgradeSummary(state: RunUpgradeState): string[] {
    return Object.entries(state)
      .filter(([, level]) => level > 0)
      .map(([id, level]) => {
        const upgrade = this.selectedUpgrades.find((candidate) => candidate.id === id);
        return `${upgrade?.category ?? "Upgrade"}: ${upgrade?.title ?? id} Lv ${level}`;
      });
  }

  private selectUpgrade(upgrade: UpgradeDefinition, state: RunUpgradeState): void {
    this.options.upgradeSystem.applyUpgrade(upgrade, state);
    this.options.soundSystem.playSfx(SOUND_ASSETS.UPGRADE_SELECT.key);
    this.selectedUpgrades.push(upgrade);
    this.options.upgradeStatusList.refresh(state);
    this.freezeMonstersAfterUpgrade();
    this.options.waveSystem.pauseSpawns(this.options.scene.time.now, balanceConfig.run.upgradeSpawnPauseDuration);
    this.options.gameStateSystem.resumePlaying();
    this.options.upgradeScreen.destroy();
    this.options.setPauseButtonVisible(true);
  }

  private freezeMonstersAfterUpgrade(): void {
    for (const monster of this.options.getMonsters()) {
      monster.freeze({
        durationMs: balanceConfig.run.upgradeFreezeDuration,
        tintColor: balanceConfig.run.upgradeFreezeTint,
      });
    }
  }
}
