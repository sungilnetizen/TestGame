import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";

type TitleScreenOptions = {
  bestScore: number;
  bestCombo: number;
  soundEnabled: boolean;
  onStart: () => void;
  onOpenShop: () => void;
  onToggleSound: () => void;
};

export class TitleScreen {
  private container?: Phaser.GameObjects.Container;
  private soundText?: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {}

  show(options: TitleScreenOptions): void {
    this.destroy();

    const container = this.scene.add.container(0, 0).setDepth(1500);
    this.container = container;

    const backdrop = this.scene.add
      .rectangle(
        balanceConfig.world.width / 2,
        balanceConfig.world.height / 2,
        balanceConfig.world.width,
        balanceConfig.world.height,
        0x07080d,
        0.96,
      )
      .setInteractive();
    const title = this.scene.add
      .text(balanceConfig.world.width / 2, 142, "Rift Blade", {
        fontFamily: "monospace",
        fontSize: "38px",
        color: "#fff1a8",
        stroke: "#31201c",
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    const records = this.scene.add
      .text(
        balanceConfig.world.width / 2,
        212,
        `Best Score ${options.bestScore}\nBest Combo ${options.bestCombo}`,
        {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#cdf4ff",
          align: "center",
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);
    const start = this.createButton(195, 330, "START", 0x2e6658, options.onStart);
    const shop = this.createButton(195, 406, "SHOP", 0x59428e, options.onOpenShop);
    const sound = this.createButton(195, 482, this.soundLabel(options.soundEnabled), 0x38475c, options.onToggleSound);
    this.soundText = sound.text;
    const controls = this.scene.add
      .text(balanceConfig.world.width / 2, 608, "Space Jump  J Attack  K Burst\nESC Pause", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#c9d2e3",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    container.add([backdrop, title, records, start.button, start.text, shop.button, shop.text, sound.button, sound.text, controls]);
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundText?.setText(this.soundLabel(enabled));
  }

  hide(): void {
    this.container?.setVisible(false);
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
    this.soundText = undefined;
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    callback: () => void,
  ): { button: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const button = this.scene.add
      .rectangle(x, y, 210, 56, color, 0.96)
      .setStrokeStyle(2, 0xf4efe2, 0.82)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    button.on("pointerdown", callback);

    return { button, text };
  }

  private soundLabel(enabled: boolean): string {
    return enabled ? "SOUND ON" : "SOUND OFF";
  }
}
