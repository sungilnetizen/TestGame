import Phaser from "phaser";
import { balanceConfig } from "./balanceConfig";
import { TitleScene } from "../scenes/TitleScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { LobbyScene } from "../scenes/LobbyScene";
import { GameScene } from "../scenes/GameScene";
import { GameOverScene } from "../scenes/GameOverScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#09080d",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: balanceConfig.world.width,
    height: balanceConfig.world.height,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [TitleScene, MainMenuScene, LobbyScene, GameScene, GameOverScene],
};
