import { upgradeDefinitions } from "../data/upgrades";

export type UpgradeCategory = "Attack" | "Burst";

export type UpgradeId =
  | "fireSword"
  | "lightningSword"
  | "giantSword"
  | "phantomSword"
  | "earthRebound"
  | "timeRune"
  | "manaCircuit"
  | "holyBurst";

export type UpgradeDefinition = {
  id: UpgradeId;
  category: UpgradeCategory;
  title: string;
  description: string;
  iconKey?: string;
};

export type RunUpgradeState = Record<UpgradeId, number>;

export const maxUpgradeLevel = 4;

export const defaultRunUpgradeState = (): RunUpgradeState => ({
  fireSword: 0,
  lightningSword: 0,
  giantSword: 0,
  phantomSword: 0,
  earthRebound: 0,
  timeRune: 0,
  manaCircuit: 0,
  holyBurst: 0,
});

export class UpgradeSystem {
  private readonly upgrades: UpgradeDefinition[] = upgradeDefinitions;

  getAllUpgrades(): UpgradeDefinition[] {
    return this.upgrades;
  }

  getChoices(count: number, state: RunUpgradeState): UpgradeDefinition[] {
    const availableUpgrades = this.upgrades.filter((upgrade) => state[upgrade.id] < maxUpgradeLevel);
    const source = availableUpgrades.length > 0 ? availableUpgrades : this.upgrades;

    return [...source]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  applyUpgrade(upgrade: UpgradeDefinition, state: RunUpgradeState): void {
    state[upgrade.id] = Math.min(maxUpgradeLevel, state[upgrade.id] + 1);
  }
}
