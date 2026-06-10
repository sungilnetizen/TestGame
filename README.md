# Rift Blade

Mobile vertical HTML5 action MVP built with Vite, TypeScript, and Phaser.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The game is designed for a 390 x 844 portrait canvas and also works with mouse clicks in a desktop browser.

## Current Stage: 1

Implemented:

- Vite + TypeScript + Phaser project setup
- Portrait 390 x 844 Phaser canvas
- `GameScene` with a simple dark fantasy rift backdrop
- Player placed near the bottom defense line
- Touch buttons for Jump, Attack, and Burst
- Desktop keyboard test inputs:
  - Space: Jump
  - J: Attack
  - K: Burst placeholder label
- Jump movement with gravity and ground-only jump
- Temporary slash visual effect when Attack is pressed
- One MVP monster type falling from the top rift
- Life decreases when a monster reaches the defense line
- Core tuning values are centralized in `src/config/balanceConfig.ts`

Not implemented yet:

- Monster HP and kill logic
- Damage numbers
- Hit slow and air float on successful attacks
- Real Burst mechanics
- Wave progression
- Upgrade cards
- Fire, lightning, giant, or phantom sword upgrades

## Next Implementation Plan

### Stage 2: Combat Core

- Add monster HP and max HP
- Apply attack hit detection as real damage
- Show floating damage numbers with Phaser Text
- Destroy monsters when HP reaches 0
- Add score and combo gain on kill
- Slow monster fall speed briefly on hit
- Reduce player falling speed or lift the player slightly after a successful aerial hit

### Stage 3: Burst

- Make Burst push all monsters upward
- Slow all monsters temporarily
- Add Burst cooldown and cooldown label
- Add a rune shockwave effect

### Stage 4: Waves and Group Spawns

- Add `WaveSystem`
- Add wave clear kill targets
- Increase monster count, HP, fall speed, and group spawn size by wave
- Apply Wave 1 to Wave 5 MVP balance values

### Stage 5: Upgrade Cards

- Pause after wave clear and show 3 random upgrade cards
- Implement 4 sword upgrades
- Implement 4 burst upgrades
- Track upgrade levels and selected upgrade list

### Stage 6: MVP Polish

- Improve hit effects, camera shake, and small hitstop
- Tune mobile button sizing and attack feel
- Add game over and restart flow
