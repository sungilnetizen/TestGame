import Phaser from "phaser";
import { IMAGE_ASSETS, SOUND_ASSETS } from "../assets/AssetManifest";
import { characterDefinitions } from "../data/characters";
import { modeDefinitions, type GameMode } from "../data/modes";
import { getStageDefinition, stageDefinitions } from "../data/stages";
import { SaveSystem } from "../systems/SaveSystem";
import { SoundSystem } from "../systems/SoundSystem";

type LobbySceneData = {
  selectedStageId?: number;
  difficulty?: "easy" | "normal" | "hard";
};

type ButtonBody = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;

export class LobbyScene extends Phaser.Scene {
  private soundSystem!: SoundSystem;
  private selectedCharacterIndex = 0;
  private selectedStageId = 1;
  private characterNameText!: Phaser.GameObjects.Text;
  private characterTraitText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;

  constructor() {
    super("LobbyScene");
  }

  create(data: LobbySceneData = {}): void {
    this.soundSystem = new SoundSystem(this);
    const saveData = SaveSystem.load();
    this.selectedStageId = data.selectedStageId ?? saveData.selectedStageId;
    this.selectedCharacterIndex = Math.max(
      0,
      characterDefinitions.findIndex((character) => character.id === saveData.selectedCharacterId),
    );

    this.createBackdrop();
    this.createCharacterPanel();
    this.createStagePanel();
    this.createModeButtons(data.difficulty ?? "normal");
    this.refreshCharacter();
    this.refreshStage();
  }

  private createBackdrop(): void {
    this.add.rectangle(195, 422, 390, 844, 0x09080d, 1);
    if (this.textures.exists(IMAGE_ASSETS.BACKGROUND_STAGE_01.key)) {
      this.add
        .image(195, 422, IMAGE_ASSETS.BACKGROUND_STAGE_01.key)
        .setDisplaySize(390, 844)
        .setAlpha(0.32);
    }
  }

  private createCharacterPanel(): void {
    this.add
      .text(195, 58, "LOBBY", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#fff1a8",
        stroke: "#31201c",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.createButton(72, 240, "<", 0x38475c, () => this.changeCharacter(-1), 52, 52);
    this.createButton(318, 240, ">", 0x38475c, () => this.changeCharacter(1), 52, 52);

    if (this.textures.exists(IMAGE_ASSETS.PLAYER_IDLE.key)) {
      this.add.image(195, 230, IMAGE_ASSETS.PLAYER_IDLE.key).setDisplaySize(142, 142);
    } else {
      this.add.rectangle(195, 230, 72, 106, 0x5fd0ff, 0.96);
    }

    this.characterNameText = this.add
      .text(195, 322, "", {
        fontFamily: "monospace",
        fontSize: "21px",
        color: "#f8f1ff",
        stroke: "#17121c",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.characterTraitText = this.add
      .text(195, 350, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#cdf4ff",
      })
      .setOrigin(0.5);
  }

  private createStagePanel(): void {
    this.stageText = this.add
      .text(195, 412, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff8df",
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    this.createButton(78, 412, "-", 0x38475c, () => this.changeStage(-1), 44, 44);
    this.createButton(312, 412, "+", 0x38475c, () => this.changeStage(1), 44, 44);
  }

  private createModeButtons(difficulty: string): void {
    this.createButton(195, 510, modeDefinitions.stage.label.toUpperCase(), 0x2e6658, () => this.startGame("stage", difficulty));
    this.createButton(195, 582, modeDefinitions.endless.label.toUpperCase(), 0x59428e, () => this.startGame("endless", difficulty));
    this.createButton(195, 654, "TRAINING", 0x70512b, () => this.showPlaceholder("Training"));
    this.createButton(195, 718, "ACHIEVEMENTS", 0x38475c, () => this.showPlaceholder("Achievements"));
    this.createButton(195, 782, "SETTING", 0x38475c, () => this.scene.start("MainMenuScene"));
  }

  private changeCharacter(direction: number): void {
    this.selectedCharacterIndex = Phaser.Math.Wrap(
      this.selectedCharacterIndex + direction,
      0,
      characterDefinitions.length,
    );
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.refreshCharacter();
  }

  private changeStage(direction: number): void {
    this.selectedStageId = Phaser.Math.Wrap(this.selectedStageId - 1 + direction, 0, stageDefinitions.length) + 1;
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.refreshStage();
  }

  private refreshCharacter(): void {
    const character = characterDefinitions[this.selectedCharacterIndex];
    this.characterNameText.setText(character.name);
    this.characterTraitText.setText(character.trait);
  }

  private refreshStage(): void {
    const stage = getStageDefinition(this.selectedStageId);
    this.stageText.setText(
      `${stage.name}\n${stage.durationMinutes} min / ${stage.waveCount} Waves\nClear +${stage.rewardGold} Gold`,
    );
  }

  private startGame(mode: GameMode, difficulty: string): void {
    const saveData = SaveSystem.load();
    SaveSystem.save({
      ...saveData,
      selectedCharacterId: characterDefinitions[this.selectedCharacterIndex].id,
      selectedStageId: this.selectedStageId,
    });
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    this.scene.start("GameScene", {
      mode,
      difficulty,
      stageId: this.selectedStageId,
      characterId: characterDefinitions[this.selectedCharacterIndex].id,
    });
  }

  private showPlaceholder(label: string): void {
    this.soundSystem.playSfx(SOUND_ASSETS.BUTTON.key);
    const text = this.add
      .text(195, 470, `${label}\nComing Soon`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff1a8",
        align: "center",
        stroke: "#31201c",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1000);
    this.time.delayedCall(850, () => text.destroy());
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    callback: () => void,
    width = 224,
    height = 52,
  ): void {
    const button = this.createButtonBody(x, y, width, height, color);
    const text = this.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: label.length > 12 ? "14px" : "17px",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    button.on("pointerdown", callback);
    text.setDepth(button.depth + 1);
  }

  private createButtonBody(x: number, y: number, width: number, height: number, color: number): ButtonBody {
    if (this.textures.exists(IMAGE_ASSETS.BUTTON_PRIMARY.key)) {
      return this.add
        .image(x, y, IMAGE_ASSETS.BUTTON_PRIMARY.key)
        .setDisplaySize(width, height)
        .setInteractive({ useHandCursor: true });
    }

    return this.add
      .rectangle(x, y, width, height, color, 0.96)
      .setStrokeStyle(2, 0xf4efe2, 0.78)
      .setInteractive({ useHandCursor: true });
  }
}
