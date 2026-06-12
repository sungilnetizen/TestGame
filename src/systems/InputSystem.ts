import Phaser from "phaser";
import type { ControlAction } from "../types/GameTypes";

type ControlHandler = (action: ControlAction) => void;

export class InputSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onControl: ControlHandler,
    private readonly onPause: () => void,
    private readonly onToggleDebug?: () => void,
    private readonly onJumpToNextBossWave?: () => void,
    private readonly onIncreaseLightningSword?: () => void,
  ) {}

  registerKeyboard(): void {
    this.scene.input.keyboard?.on("keydown-SPACE", () => this.onControl("jump"));
    this.scene.input.keyboard?.on("keydown-J", () => this.onControl("attack"));
    this.scene.input.keyboard?.on("keydown-K", () => this.onControl("burst"));
    this.scene.input.keyboard?.on("keydown-ESC", () => this.onPause());
    this.scene.input.keyboard?.on("keydown-D", () => this.onToggleDebug?.());
    this.scene.input.keyboard?.on("keydown-Q", () => this.onJumpToNextBossWave?.());
    this.scene.input.keyboard?.on("keydown-W", () => this.onIncreaseLightningSword?.());
  }
}
