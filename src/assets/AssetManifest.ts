export type AssetEntry = {
  key: string;
  path: string;
};

export const IMAGE_ASSETS = {
  BACKGROUND_STAGE_01: {
    key: "background_stage_01",
    path: "assets/images/backgrounds/stage_01.png",
  },
  TITLE_BACKGROUND: {
    key: "title_background",
    path: "assets/images/backgrounds/title.png",
  },
  PLAYER_IDLE: {
    key: "player_idle",
    path: "assets/images/player/player_idle.png",
  },
  PLAYER_ATTACK: {
    key: "player_attack",
    path: "assets/images/player/player_attack.png",
  },
  ENEMY_SMALL: {
    key: "enemy_small",
    path: "assets/images/enemies/enemy_small.png",
  },
  ENEMY_BASIC: {
    key: "enemy_basic",
    path: "assets/images/enemies/enemy_basic.png",
  },
  ENEMY_TANK: {
    key: "enemy_tank",
    path: "assets/images/enemies/enemy_tank.png",
  },
  ENEMY_FAST: {
    key: "enemy_fast",
    path: "assets/images/enemies/enemy_fast.png",
  },
  ENEMY_BRUTE: {
    key: "enemy_brute",
    path: "assets/images/enemies/enemy_brute.png",
  },
  ENEMY_ORB: {
    key: "enemy_orb",
    path: "assets/images/enemies/enemy_orb.png",
  },
  ENEMY_BOSS: {
    key: "enemy_boss",
    path: "assets/images/enemies/enemy_boss.png",
  },
  ENEMY_BOSS_WAVE_10: {
    key: "enemy_boss_wave_10",
    path: "assets/images/enemies/enemy_boss_wave_10.png",
  },
  ENEMY_BOSS_WAVE_15: {
    key: "enemy_boss_wave_15",
    path: "assets/images/enemies/enemy_boss_wave_15.png",
  },
  ENEMY_BOSS_WAVE_20: {
    key: "enemy_boss_wave_20",
    path: "assets/images/enemies/enemy_boss_wave_20.png",
  },
  ENEMY_BOSS_WAVE_25: {
    key: "enemy_boss_wave_25",
    path: "assets/images/enemies/enemy_boss_wave_25.png",
  },
  ENEMY_BOSS_WAVE_30: {
    key: "enemy_boss_wave_30",
    path: "assets/images/enemies/enemy_boss_wave_30.png",
  },
  SLASH_BASIC: {
    key: "slash_basic",
    path: "assets/images/effects/slash_basic.png",
  },
  BURST_EFFECT: {
    key: "burst_effect",
    path: "assets/images/effects/burst_effect.png",
  },
  KILL_BURST: {
    key: "kill_burst",
    path: "assets/images/effects/kill_burst.png",
  },
  SLASH_MARK: {
    key: "slash_mark",
    path: "assets/images/effects/slash_mark.png",
  },
  UPGRADE_CARD_BG: {
    key: "upgrade_card_bg",
    path: "assets/images/ui/upgrade_card_bg.png",
  },
  UPGRADE_CARD_ATTACK: {
    key: "upgrade_card_attack",
    path: "assets/images/ui/upgrade_card_attack.png",
  },
  UPGRADE_CARD_BURST: {
    key: "upgrade_card_burst",
    path: "assets/images/ui/upgrade_card_burst.png",
  },
  BUTTON_PRIMARY: {
    key: "button_primary",
    path: "assets/images/ui/button_primary.png",
  },
  BUTTON_SECONDARY: {
    key: "button_secondary",
    path: "assets/images/ui/button_secondary.png",
  },
  BUTTON_DANGER: {
    key: "button_danger",
    path: "assets/images/ui/button_danger.png",
  },
  BUTTON_TOUCH_JUMP: {
    key: "button_touch_jump",
    path: "assets/images/ui/button_touch_jump.png",
  },
  BUTTON_TOUCH_ATTACK: {
    key: "button_touch_attack",
    path: "assets/images/ui/button_touch_attack.png",
  },
  BUTTON_TOUCH_BURST: {
    key: "button_touch_burst",
    path: "assets/images/ui/button_touch_burst.png",
  },
  BUTTON_PAUSE: {
    key: "button_pause",
    path: "assets/images/ui/button_pause.png",
  },
  UPGRADE_FIRE_SWORD: {
    key: "upgrade_fire_sword",
    path: "assets/images/upgrades/fire_sword.png",
  },
  UPGRADE_LIGHTNING_SWORD: {
    key: "upgrade_lightning_sword",
    path: "assets/images/upgrades/lightning_sword.png",
  },
  UPGRADE_GIANT_SWORD: {
    key: "upgrade_giant_sword",
    path: "assets/images/upgrades/giant_sword.png",
  },
  UPGRADE_PHANTOM_SWORD: {
    key: "upgrade_phantom_sword",
    path: "assets/images/upgrades/phantom_sword.png",
  },
  UPGRADE_EARTH_REBOUND: {
    key: "upgrade_earth_rebound",
    path: "assets/images/upgrades/earth_rebound.png",
  },
  UPGRADE_TIME_RUNE: {
    key: "upgrade_time_rune",
    path: "assets/images/upgrades/time_rune.png",
  },
  UPGRADE_MANA_CIRCUIT: {
    key: "upgrade_mana_circuit",
    path: "assets/images/upgrades/mana_circuit.png",
  },
  UPGRADE_HOLY_BURST: {
    key: "upgrade_holy_burst",
    path: "assets/images/upgrades/holy_burst.png",
  },
} as const satisfies Record<string, AssetEntry>;

export const SOUND_ASSETS = {
  BUTTON: {
    key: "sfx_button",
    path: "assets/sounds/sfx/button.wav",
  },
  ATTACK: {
    key: "sfx_attack",
    path: "assets/sounds/sfx/attack.wav",
  },
  HIT: {
    key: "sfx_hit",
    path: "assets/sounds/sfx/hit.wav",
  },
  KILL: {
    key: "sfx_kill",
    path: "assets/sounds/sfx/kill.wav",
  },
  BURST: {
    key: "sfx_burst",
    path: "assets/sounds/sfx/burst.wav",
  },
  UPGRADE_SELECT: {
    key: "sfx_upgrade_select",
    path: "assets/sounds/sfx/upgrade_select.wav",
  },
  GAMEOVER: {
    key: "sfx_gameover",
    path: "assets/sounds/sfx/gameover.wav",
  },
  BGM_BATTLE: {
    key: "bgm_battle",
    path: "assets/sounds/bgm/battle.mp3",
  },
} as const satisfies Record<string, AssetEntry>;

export const imageAssetList = Object.values(IMAGE_ASSETS);
export const soundAssetList = Object.values(SOUND_ASSETS);
