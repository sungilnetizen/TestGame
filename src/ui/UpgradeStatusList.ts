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
        col * (this.options.compact ? 150 : 170),
        row * (this.options.compact ? 28 : 34),
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
    const iconSize = this.options.compact ? 18 : 22;
    const iconColor = upgrade.category === "Attack" ? 0xffe071 : 0x9ad7ff;
    const icon = this.scene.add
      .rectangle(0, 0, iconSize, iconSize, 0x161d27, 0.94)
      .setStrokeStyle(2, iconColor, 0.9)
      .setOrigin(0, 0);
    const name = this.scene.add.text(iconSize + 7, -1, upgrade.title, {
      fontFamily: "monospace",
      fontSize: this.options.compact ? "10px" : "12px",
      color: "#f4efe2",
    });
    const levelText = this.scene.add.text(iconSize + 7, this.options.compact ? 12 : 15, `Lv ${level}`, {
      fontFamily: "monospace",
      fontSize: this.options.compact ? "9px" : "10px",
      color: "#fff1a8",
    });

    item.add([icon, name, levelText]);
    return item;
  }
}
