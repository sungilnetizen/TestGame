export type GameState = "playing" | "upgrade" | "gameover";

export class GameStateSystem {
  private state: GameState = "playing";

  reset(): void {
    this.state = "playing";
  }

  enterUpgrade(): void {
    this.state = "upgrade";
  }

  resumePlaying(): void {
    this.state = "playing";
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

  isGameOver(): boolean {
    return this.state === "gameover";
  }

  blocksGameplay(): boolean {
    return this.state !== "playing";
  }
}
