import Phaser from "phaser";

const SOUND_ENABLED_KEY = "riftBlade.soundEnabled";

export class SoundSystem {
  private enabled = true;
  private bgm?: Phaser.Sound.BaseSound;
  private currentBgmKey?: string;
  private readonly lastPlayedAt = new Map<string, number>();

  constructor(private readonly scene: Phaser.Scene) {
    this.enabled = this.readEnabled();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    window.localStorage.setItem(SOUND_ENABLED_KEY, enabled ? "1" : "0");

    if (!enabled) {
      this.stopBgm();
    } else if (this.currentBgmKey) {
      this.playBgm(this.currentBgmKey);
    }
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  play(_key: string): void {
    this.playSfx(_key);
  }

  playSfx(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    if (!this.enabled) return;
    if (!this.scene.cache.audio.exists(key)) return;

    const now = this.scene.time.now;
    const lastPlayedAt = this.lastPlayedAt.get(key) ?? -Infinity;
    if (now - lastPlayedAt < 45) return;

    this.lastPlayedAt.set(key, now);
    this.scene.sound.play(key, config);
  }

  playBgm(key: string, config: Phaser.Types.Sound.SoundConfig = { loop: true, volume: 0.38 }): void {
    this.currentBgmKey = key;
    if (!this.enabled) return;
    if (!this.scene.cache.audio.exists(key)) return;
    if (this.bgm?.isPlaying && this.bgm.key === key) return;

    this.stopBgm();
    this.bgm = this.scene.sound.add(key, config);
    this.bgm.play();
  }

  stopBgm(): void {
    this.bgm?.stop();
    this.bgm?.destroy();
    this.bgm = undefined;
  }

  private readEnabled(): boolean {
    const value = window.localStorage.getItem(SOUND_ENABLED_KEY);
    return value === null ? true : value === "1";
  }
}
