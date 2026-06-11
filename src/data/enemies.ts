import { balanceConfig } from "../config/balanceConfig";

export const enemyDefinitions = {
  small: {
    assetKey: "enemy_small",
    ...balanceConfig.enemyTypes.small,
    color: 0x4fcf78,
    shape: "circle",
  },
  normal: {
    assetKey: "enemy_basic",
    ...balanceConfig.enemyTypes.normal,
    color: 0x7e3fb8,
    shape: "circle",
  },
  tank: {
    assetKey: "enemy_tank",
    ...balanceConfig.enemyTypes.tank,
    color: 0xb84a4a,
    shape: "circle",
  },
  swift: {
    assetKey: "enemy_fast",
    ...balanceConfig.enemyTypes.swift,
    color: 0x49b8cf,
    shape: "diamond",
  },
  brute: {
    assetKey: "enemy_brute",
    ...balanceConfig.enemyTypes.brute,
    color: 0xd06a2c,
    shape: "square",
  },
  orb: {
    assetKey: "enemy_orb",
    ...balanceConfig.enemyTypes.orb,
    color: 0xd7c94f,
    shape: "diamond",
  },
  boss: {
    assetKey: "enemy_boss",
    ...balanceConfig.enemyTypes.boss,
    color: 0x6f5c82,
    shape: "square",
  },
} as const;

export type EnemyType = keyof typeof enemyDefinitions;
