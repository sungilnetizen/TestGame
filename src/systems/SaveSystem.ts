const SAVE_KEY = "riftBlade.saveData.v1";

export type SaveData = {
  gold: number;
  selectedCharacterId: string;
  selectedStageId: number;
  clearedStageIds: number[];
  unlockedCharacterIds: string[];
  purchasedUpgradeIds: string[];
  permanentStats: Record<string, number>;
};

const defaultSaveData: SaveData = {
  gold: 0,
  selectedCharacterId: "knight",
  selectedStageId: 1,
  clearedStageIds: [],
  unlockedCharacterIds: ["knight"],
  purchasedUpgradeIds: [],
  permanentStats: {},
};

export class SaveSystem {
  static load(): SaveData {
    const rawData = window.localStorage.getItem(SAVE_KEY);
    if (!rawData) {
      return { ...defaultSaveData };
    }

    try {
      return {
        ...defaultSaveData,
        ...JSON.parse(rawData),
      };
    } catch {
      return { ...defaultSaveData };
    }
  }

  static save(data: SaveData): void {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static addGold(amount: number): SaveData {
    const data = this.load();
    const nextData = {
      ...data,
      gold: data.gold + Math.max(0, Math.floor(amount)),
    };
    this.save(nextData);
    return nextData;
  }

  static markStageCleared(stageId: number): SaveData {
    const data = this.load();
    const clearedStageIds = data.clearedStageIds.includes(stageId)
      ? data.clearedStageIds
      : [...data.clearedStageIds, stageId].sort((a, b) => a - b);
    const nextData = {
      ...data,
      clearedStageIds,
    };
    this.save(nextData);
    return nextData;
  }
}
