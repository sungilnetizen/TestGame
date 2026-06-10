export type GameState = "title" | "playing" | "paused" | "shop" | "upgrade" | "gameover";

export class GameStateSystem {
  private state: GameState = "title";

  reset(): void {
    this.state = "title";
  }

  enterTitle(): void {
    this.state = "title";
  }

  enterPlaying(): void {
    this.state = "playing";
  }

  enterUpgrade(): void {
    this.state = "upgrade";
  }

  resumePlaying(): void {
    this.state = "playing";
  }

  enterPaused(): void {
    if (this.state !== "playing") return;

    this.state = "paused";
  }

  enterPausedFromShop(): void {
    if (this.state !== "shop") return;

    this.state = "paused";
  }

  enterShop(): void {
    if (this.state !== "title" && this.state !== "paused") return;

    this.state = "shop";
  }

  enterGameOver(): void {
    this.state = "gameover";
  }

  isPlaying(): boolean {
    return this.state === "playing";
  }

  isUpgrade(): boolean {
    return this.state === "upgrade";
  }

  isPaused(): boolean {
    return this.state === "paused";
  }

  isTitle(): boolean {
    return this.state === "title";
  }

  isGameOver(): boolean {
    return this.state === "gameover";
  }

  canPause(): boolean {
    return this.state === "playing";
  }

  blocksGameplay(): boolean {
    return this.state !== "playing";
  }
}
