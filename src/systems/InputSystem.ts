import Phaser from "phaser";
import type { ControlAction } from "../types/GameTypes";

type ControlHandler = (action: ControlAction) => void;

export class InputSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onControl: ControlHandler,
    private readonly onPause: () => void,
  ) {}

  registerKeyboard(): void {
    this.scene.input.keyboard?.on("keydown-SPACE", () => this.onControl("jump"));
    this.scene.input.keyboard?.on("keydown-J", () => this.onControl("attack"));
    this.scene.input.keyboard?.on("keydown-K", () => this.onControl("burst"));
    this.scene.input.keyboard?.on("keydown-ESC", () => this.onPause());
  }
}
