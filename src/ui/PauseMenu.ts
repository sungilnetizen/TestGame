import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { IMAGE_ASSETS } from "../assets/AssetManifest";

type ButtonBody = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;

type PauseMenuOptions = {
  soundEnabled: boolean;
  onResume: () => void;
  onToggleSound: () => void;
  onOpenShop: () => void;
  onRestart: () => void;
  onQuitToTitle: () => void;
};

export class PauseMenu {
  private container?: Phaser.GameObjects.Container;
  private soundText?: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {}

  show(options: PauseMenuOptions): void {
    this.destroy();

    const container = this.scene.add.container(0, 0).setDepth(1400);
    this.container = container;

    const backdrop = this.scene.add
      .rectangle(
        balanceConfig.world.width / 2,
        balanceConfig.world.height / 2,
        balanceConfig.world.width,
        balanceConfig.world.height,
        0x050507,
        0.72,
      )
      .setInteractive();
    const title = this.scene.add
      .text(balanceConfig.world.width / 2, 172, "Paused", {
        fontFamily: "monospace",
        fontSize: "31px",
        color: "#fff1a8",
        stroke: "#31201c",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const resume = this.createButton(195, 284, "RESUME", 0x2e6658, IMAGE_ASSETS.BUTTON_PRIMARY.key, options.onResume);
    const sound = this.createButton(195, 350, this.soundLabel(options.soundEnabled), 0x38475c, IMAGE_ASSETS.BUTTON_SECONDARY.key, options.onToggleSound);
    this.soundText = sound.text;
    const shop = this.createButton(195, 416, "SHOP", 0x59428e, IMAGE_ASSETS.BUTTON_SECONDARY.key, options.onOpenShop);
    const restart = this.createButton(195, 482, "RESTART", 0x70512b, IMAGE_ASSETS.BUTTON_SECONDARY.key, options.onRestart);
    const quit = this.createButton(195, 548, "QUIT TO TITLE", 0x733535, IMAGE_ASSETS.BUTTON_DANGER.key, options.onQuitToTitle);

    container.add([
      backdrop,
      title,
      resume.button,
      resume.text,
      sound.button,
      sound.text,
      shop.button,
      shop.text,
      restart.button,
      restart.text,
      quit.button,
      quit.text,
    ]);
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
    assetKey: string,
    callback: () => void,
  ): { button: ButtonBody; text: Phaser.GameObjects.Text } {
    const button = this.createButtonBody(x, y, 218, 50, color, assetKey);
    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    button.on("pointerdown", callback);

    return { button, text };
  }

  private createButtonBody(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    assetKey: string,
  ): ButtonBody {
    if (this.scene.textures.exists(assetKey)) {
      return this.scene.add
        .image(x, y, assetKey)
        .setDisplaySize(width, height)
        .setInteractive({ useHandCursor: true });
    }

    return this.scene.add
      .rectangle(x, y, width, height, color, 0.96)
      .setStrokeStyle(2, 0xf4efe2, 0.78)
      .setInteractive({ useHandCursor: true });
  }

  private soundLabel(enabled: boolean): string {
    return enabled ? "SOUND ON" : "SOUND OFF";
  }
}
