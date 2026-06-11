import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { UpgradeStatusList } from "./UpgradeStatusList";
import {
  maxUpgradeLevel,
  RunUpgradeState,
  UpgradeDefinition,
  UpgradeSystem,
} from "../systems/UpgradeSystem";
import { IMAGE_ASSETS } from "../assets/AssetManifest";

type UpgradeScreenOptions = {
  state: RunUpgradeState;
  onSelect: (upgrade: UpgradeDefinition) => void;
};

export class UpgradeScreen {
  private overlay?: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly upgradeSystem: UpgradeSystem,
  ) {}

  show(options: UpgradeScreenOptions): void {
    const choices = this.upgradeSystem.getChoices(3, options.state);
    const overlay = this.scene.add.container(0, 0).setDepth(1200);
    this.overlay = overlay;

    const backdrop = this.scene.add.rectangle(
      balanceConfig.world.width / 2,
      balanceConfig.world.height / 2,
      balanceConfig.world.width,
      balanceConfig.world.height,
      0x06070b,
      0.72,
    );
    const title = this.scene.add
      .text(balanceConfig.world.width / 2, 180, "Choose Upgrade", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#fff1a8",
        stroke: "#31201c",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    overlay.add([backdrop, title]);

    choices.forEach((upgrade, index) => {
      const x = balanceConfig.world.width / 2;
      const y = 274 + index * 118;
      const card = this.createUpgradeCard(x, y, upgrade, options);
      overlay.add(card);
    });

    const statusTitle = this.scene.add
      .text(48, 596, "Current Upgrades", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#cdf4ff",
      })
      .setOrigin(0, 0.5);
    const statusList = new UpgradeStatusList(this.scene, this.upgradeSystem.getAllUpgrades(), {
      x: 48,
      y: 622,
      columns: 3,
      maxItems: 8,
      compact: true,
    }).setDepth(1201);
    statusList.refresh(options.state);
    overlay.add([statusTitle, statusList.getContainer()]);
  }

  destroy(): void {
    this.overlay?.destroy();
    this.overlay = undefined;
  }

  private createUpgradeCard(
    x: number,
    y: number,
    upgrade: UpgradeDefinition,
    options: UpgradeScreenOptions,
  ): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y).setScale(0.94);
    const panel = this.createCardPanel(upgrade);
    const icon = this.createUpgradeIcon(upgrade, upgrade.category);
    const title = this.scene.add
      .text(-54, -12, upgrade.title, {
        fontFamily: "monospace",
        fontSize: "19px",
        color: "#f8f1ff",
      })
      .setOrigin(0, 0.5);
    const description = this.scene.add
      .text(-54, 13, upgrade.description, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#c9d2e3",
      })
      .setOrigin(0, 0.5);
    const currentLevel = options.state[upgrade.id];
    const levelText = this.scene.add
      .text(140, -35, this.createLevelLabel(currentLevel), {
        fontFamily: "monospace",
        fontSize: "15px",
        color: currentLevel >= maxUpgradeLevel ? "#9a8f9e" : "#fff1a8",
        stroke: "#2b1c16",
        strokeThickness: 3,
      })
      .setOrigin(1, 0.5);

    card.add([panel, icon, title, description, levelText]);

    panel.on("pointerover", () => card.setScale(1));
    panel.on("pointerout", () => card.setScale(0.94));
    panel.on("pointerdown", () => options.onSelect(upgrade));

    this.scene.tweens.add({
      targets: card,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Back.easeOut",
    });

    return card;
  }

  private createCardPanel(upgrade: UpgradeDefinition): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    const categoryCardAsset =
      upgrade.category === "Attack" ? IMAGE_ASSETS.UPGRADE_CARD_ATTACK : IMAGE_ASSETS.UPGRADE_CARD_BURST;
    const cardAsset = this.scene.textures.exists(categoryCardAsset.key)
      ? categoryCardAsset
      : IMAGE_ASSETS.UPGRADE_CARD_BG;

    if (this.scene.textures.exists(cardAsset.key)) {
      return this.scene.add
        .image(0, 0, cardAsset.key)
        .setDisplaySize(318, 104)
        .setInteractive({ useHandCursor: true });
    }

    return this.scene.add
      .rectangle(0, 0, 318, 104, 0x18202a, 0.96)
      .setStrokeStyle(3, upgrade.category === "Attack" ? 0xffe071 : 0x9ad7ff, 0.92)
      .setInteractive({ useHandCursor: true });
  }

  private createUpgradeIcon(
    upgrade: UpgradeDefinition,
    category: UpgradeDefinition["category"],
  ): Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse {
    if (!upgrade.iconKey || !this.scene.textures.exists(upgrade.iconKey)) {
      return this.scene.add
        .ellipse(-106, 0, 68, 68, category === "Attack" ? 0xffe071 : 0x9ad7ff, 0.22)
        .setStrokeStyle(2, category === "Attack" ? 0xffe071 : 0x9ad7ff, 0.72);
    }

    return this.scene.add
      .image(-106, 0, upgrade.iconKey)
      .setDisplaySize(68, 68);
  }

  private createLevelLabel(currentLevel: number): string {
    if (currentLevel >= maxUpgradeLevel) return "MAX";

    return `Lv ${currentLevel} > ${Math.min(maxUpgradeLevel, currentLevel + 1)}`;
  }
}
