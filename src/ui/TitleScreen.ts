import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { IMAGE_ASSETS } from "../assets/AssetManifest";

type ButtonBody = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;

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
  private settingsPanel?: Phaser.GameObjects.Container;
  private soundText?: Phaser.GameObjects.Text;
  private currentOptions?: TitleScreenOptions;

  constructor(private readonly scene: Phaser.Scene) {}

  show(options: TitleScreenOptions): void {
    this.destroy();
    this.currentOptions = options;

    const container = this.scene.add.container(0, 0).setDepth(1500);
    this.container = container;

    const backdrop = this.createBackdrop();
    const records = this.scene.add
      .text(
        balanceConfig.world.width / 2,
        232,
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
    const start = this.createButton(195, 374, "START", 0x2e6658, options.onStart);
    const shop = this.createButton(195, 450, "SHOP", 0x59428e, options.onOpenShop);
    const setting = this.createButton(195, 526, "SETTING", 0x38475c, () => this.showSettingsPanel());

    container.add([backdrop, records, start.button, start.text, shop.button, shop.text, setting.button, setting.text]);
  }

  setSoundEnabled(enabled: boolean): void {
    if (this.currentOptions) {
      this.currentOptions = {
        ...this.currentOptions,
        soundEnabled: enabled,
      };
    }
    this.soundText?.setText(this.soundLabel(enabled));
  }

  hide(): void {
    this.container?.setVisible(false);
  }

  destroy(): void {
    this.settingsPanel?.destroy();
    this.container?.destroy();
    this.container = undefined;
    this.settingsPanel = undefined;
    this.soundText = undefined;
    this.currentOptions = undefined;
  }

  private createBackdrop(): Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image {
    if (this.scene.textures.exists(IMAGE_ASSETS.TITLE_BACKGROUND.key)) {
      return this.scene.add
        .image(balanceConfig.world.width / 2, balanceConfig.world.height / 2, IMAGE_ASSETS.TITLE_BACKGROUND.key)
        .setDisplaySize(balanceConfig.world.width, balanceConfig.world.height)
        .setInteractive();
    }

    return this.scene.add
      .rectangle(
        balanceConfig.world.width / 2,
        balanceConfig.world.height / 2,
        balanceConfig.world.width,
        balanceConfig.world.height,
        0x07080d,
        0.96,
      )
      .setInteractive();
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    callback: () => void,
  ): { button: ButtonBody; text: Phaser.GameObjects.Text } {
    const button = this.createButtonBody(x, y, 210, 56, color, IMAGE_ASSETS.BUTTON_PRIMARY.key);
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
      .setStrokeStyle(2, 0xf4efe2, 0.82)
      .setInteractive({ useHandCursor: true });
  }

  private soundLabel(enabled: boolean): string {
    return enabled ? "SOUND ON" : "SOUND OFF";
  }

  private showSettingsPanel(): void {
    if (!this.container || !this.currentOptions) return;

    this.settingsPanel?.destroy();

    const panel = this.scene.add.container(0, 0).setDepth(1502);
    this.settingsPanel = panel;

    const dim = this.scene.add
      .rectangle(
        balanceConfig.world.width / 2,
        balanceConfig.world.height / 2,
        balanceConfig.world.width,
        balanceConfig.world.height,
        0x000000,
        0.45,
      )
      .setInteractive();
    const box = this.scene.add
      .rectangle(balanceConfig.world.width / 2, 408, 282, 214, 0x111722, 0.96)
      .setStrokeStyle(3, 0xf4efe2, 0.72);
    const title = this.scene.add
      .text(balanceConfig.world.width / 2, 338, "SETTING", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#fff1a8",
        stroke: "#31201c",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const sound = this.createButton(
      balanceConfig.world.width / 2,
      408,
      this.soundLabel(this.currentOptions.soundEnabled),
      0x38475c,
      this.currentOptions.onToggleSound,
    );
    this.soundText = sound.text;
    const close = this.createButton(balanceConfig.world.width / 2, 478, "CLOSE", 0x59428e, () => {
      this.settingsPanel?.destroy();
      this.settingsPanel = undefined;
    });

    panel.add([dim, box, title, sound.button, sound.text, close.button, close.text]);
  }
}
