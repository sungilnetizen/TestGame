import Phaser from "phaser";
import { RunUpgradeState, UpgradeDefinition } from "../systems/UpgradeSystem";

type UpgradeStatusListOptions = {
  x: number;
  y: number;
  columns?: number;
  maxItems?: number;
  compact?: boolean;
};

export class UpgradeStatusList {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly upgrades: UpgradeDefinition[];
  private readonly options: Required<UpgradeStatusListOptions>;

  constructor(scene: Phaser.Scene, upgrades: UpgradeDefinition[], options: UpgradeStatusListOptions) {
    this.scene = scene;
    this.upgrades = upgrades;
    this.options = {
      columns: 1,
      maxItems: 8,
      compact: false,
      ...options,
    };
    this.container = scene.add.container(options.x, options.y);
  }

  setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  refresh(state: RunUpgradeState): void {
    this.container.removeAll(true);

    const activeUpgrades = this.upgrades
      .filter((upgrade) => state[upgrade.id] > 0)
      .slice(0, this.options.maxItems);

    if (activeUpgrades.length === 0) {
      return;
    }

    activeUpgrades.forEach((upgrade, index) => {
      const col = index % this.options.columns;
      const row = Math.floor(index / this.options.columns);
      const item = this.createItem(
        col * (this.options.compact ? 102 : 170),
        row * (this.options.compact ? 40 : 34),
        upgrade,
        state[upgrade.id],
      );
      this.container.add(item);
    });
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private createItem(
    x: number,
    y: number,
    upgrade: UpgradeDefinition,
    level: number,
  ): Phaser.GameObjects.Container {
    const item = this.scene.add.container(x, y);
    const iconSize = this.options.compact ? 31 : 22;
    const iconColor = upgrade.category === "Attack" ? 0xffe071 : 0x9ad7ff;
    const icon = this.createIcon(upgrade, iconSize, iconColor);
    const name = this.scene.add.text(iconSize + 8, 0, upgrade.title, {
      fontFamily: "monospace",
      fontSize: this.options.compact ? "13px" : "12px",
      color: "#f4efe2",
      stroke: "#17121a",
      strokeThickness: this.options.compact ? 1 : 2,
    }).setShadow(0, 1, "#0c080d", 2, false, true);
    const levelText = this.scene.add.text(iconSize + 8, this.options.compact ? 19 : 15, `Lv ${level}`, {
      fontFamily: "monospace",
      fontSize: this.options.compact ? "11px" : "10px",
      color: "#fff1a8",
      stroke: "#2b1c16",
      strokeThickness: 1,
    }).setShadow(0, 1, "#120b08", 2, false, true);

    item.add([icon, name, levelText]);
    return item;
  }

  private createIcon(
    upgrade: UpgradeDefinition,
    iconSize: number,
    iconColor: number,
  ): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    if (upgrade.iconKey && this.scene.textures.exists(upgrade.iconKey)) {
      return this.scene.add
        .image(iconSize / 2, iconSize / 2, upgrade.iconKey)
        .setDisplaySize(iconSize, iconSize);
    }

    return this.scene.add
      .rectangle(0, 0, iconSize, iconSize, 0x161d27, 0.94)
      .setStrokeStyle(2, iconColor, 0.9)
      .setOrigin(0, 0);
  }
}
