import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";

type ShopScreenOptions = {
  gold: number;
  onBack: () => void;
};

export class ShopScreen {
  private container?: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {}

  show(options: ShopScreenOptions): void {
    this.destroy();

    const container = this.scene.add.container(0, 0).setDepth(1450);
    this.container = container;

    const backdrop = this.scene.add
      .rectangle(
        balanceConfig.world.width / 2,
        balanceConfig.world.height / 2,
        balanceConfig.world.width,
        balanceConfig.world.height,
        0x08090f,
        0.94,
      )
      .setInteractive();
    const title = this.scene.add
      .text(balanceConfig.world.width / 2, 114, "Shop", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#cdf4ff",
        stroke: "#172433",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const gold = this.scene.add
      .text(balanceConfig.world.width / 2, 164, `Gold ${options.gold}`, {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#fff1a8",
      })
      .setOrigin(0.5);
    const cards = [
      this.createProductCard(195, 258, "Attack Power", "TODO permanent upgrade"),
      this.createProductCard(195, 366, "Max Life", "TODO permanent upgrade"),
      this.createProductCard(195, 474, "Burst Cooldown", "TODO permanent upgrade"),
    ];
    const back = this.createButton(195, 640, "BACK", 0x2e6658, options.onBack);

    container.add([backdrop, title, gold, ...cards, back.button, back.text]);
  }

  hide(): void {
    this.container?.setVisible(false);
  }

  destroy(): void {
    this.container?.destroy();
    this.container = undefined;
  }

  private createProductCard(x: number, y: number, title: string, description: string): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y);
    const panel = this.scene.add
      .rectangle(0, 0, 286, 82, 0x18202a, 0.96)
      .setStrokeStyle(2, 0x8f9bad, 0.75);
    const titleText = this.scene.add
      .text(-126, -17, title, {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#f8f1ff",
      })
      .setOrigin(0, 0.5);
    const descriptionText = this.scene.add
      .text(-126, 17, description, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#aeb8ca",
      })
      .setOrigin(0, 0.5);

    card.add([panel, titleText, descriptionText]);
    return card;
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    callback: () => void,
  ): { button: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const button = this.scene.add
      .rectangle(x, y, 176, 52, color, 0.96)
      .setStrokeStyle(2, 0xf4efe2, 0.78)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    button.on("pointerdown", callback);

    return { button, text };
  }
}
