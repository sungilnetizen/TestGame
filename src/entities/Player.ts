import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { IMAGE_ASSETS } from "../assets/AssetManifest";

export class Player extends Phaser.GameObjects.Container {
  private readonly bodyBox: Phaser.GameObjects.Rectangle;
  private readonly collisionDebugBox: Phaser.GameObjects.Rectangle;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private sprite?: Phaser.GameObjects.Sprite;
  private idleTween?: Phaser.Tweens.Tween;
  private spriteDisplaySize = 0;
  private activeTextureKey?: string;
  private attackAnimationToken = 0;
  private velocityY = 0;
  private grounded = true;
  private airAttackUsed = false;
  private airBrakeUntil = -Infinity;

  constructor(scene: Phaser.Scene) {
    super(scene, balanceConfig.player.startX, balanceConfig.player.startY);
    this.setDepth(700);
    this.shadow = scene.add
      .ellipse(
        balanceConfig.player.startX,
        this.getShadowY(),
        balanceConfig.player.width * 2.05,
        balanceConfig.player.height * 0.28,
        0x050308,
        0.48,
      )
      .setDepth(695);

    this.bodyBox = scene.add.rectangle(
      0,
      0,
      balanceConfig.player.width,
      balanceConfig.player.height,
      0x5fd0ff,
    );
    this.collisionDebugBox = scene.add
      .rectangle(
        0,
        0,
        balanceConfig.player.width,
        balanceConfig.player.height,
        0xff3d3d,
        0.08,
      )
      .setStrokeStyle(2, 0xff3d3d, 0.42);

    if (scene.textures.exists(IMAGE_ASSETS.PLAYER_IDLE.key)) {
      this.sprite = scene.add
        .sprite(0, -4, IMAGE_ASSETS.PLAYER_IDLE.key)
        .setDisplaySize(this.getSpriteDisplaySize(), this.getSpriteDisplaySize());
      this.sprite.setOrigin(0.5, 1);
      this.sprite.setY(this.sprite.y + this.sprite.displayHeight / 2);
      this.activeTextureKey = IMAGE_ASSETS.PLAYER_IDLE.key;
      this.createJumpAnimation();
      this.createAttackAnimation();
      this.bodyBox.setVisible(false);
      this.add([this.sprite, this.bodyBox, this.collisionDebugBox]);
      this.createIdleTween();
    } else {
      const helm = scene.add.rectangle(0, -25, 22, 10, 0xf3d88b);
      const blade = scene.add.rectangle(20, -10, 5, 42, 0xe9edf6);
      this.add([blade, this.bodyBox, helm, this.collisionDebugBox]);
    }

    scene.add.existing(this);
  }

  jump(): void {
    if (!this.grounded) return;

    this.velocityY = -balanceConfig.player.jumpPower;
    this.grounded = false;
    this.airAttackUsed = false;
    this.airBrakeUntil = -Infinity;
    this.setPlayerTexture(IMAGE_ASSETS.PLAYER_JUMP.key);
    this.playJumpAnimation();
    this.stopIdleTween();
  }

  softenJumpFromAttack(): void {
    if (this.grounded || this.airAttackUsed) return;

    this.airAttackUsed = true;

    if (this.velocityY < 0) {
      this.velocityY *= balanceConfig.combat.airAttackVelocityMultiplier;
      this.airBrakeUntil = this.scene.time.now + balanceConfig.combat.airAttackBrakeDuration;
    }
  }

  playAttackAnimation(): void {
    if (!this.sprite || !this.scene.textures.exists(IMAGE_ASSETS.PLAYER_ATTACK.key)) return;

    this.attackAnimationToken += 1;
    const attackToken = this.attackAnimationToken;
    this.stopIdleTween();
    this.setPlayerTexture(IMAGE_ASSETS.PLAYER_ATTACK.key, 1.5);

    if (!this.scene.anims.exists("player_attack_anim")) {
      return;
    }

    this.sprite.play("player_attack_anim");
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.restoreAfterAttack(attackToken));
  }

  forceFall(): void {
    if (this.grounded) return;

    this.airBrakeUntil = -Infinity;
    this.velocityY = Math.max(this.velocityY, balanceConfig.combat.collisionFallSpeed);
  }

  updatePlayer(deltaMs: number): void {
    const dt = deltaMs / 1000;
    const gravityMultiplier =
      !this.grounded && this.velocityY < 0 && this.scene.time.now < this.airBrakeUntil
        ? balanceConfig.combat.airAttackGravityMultiplier
        : 1;

    this.velocityY += balanceConfig.player.gravity * gravityMultiplier * dt;
    this.y += this.velocityY * dt;

    if (this.y >= balanceConfig.player.startY) {
      this.y = balanceConfig.player.startY;
      this.velocityY = 0;
      const didLand = !this.grounded;
      this.grounded = true;
      this.airAttackUsed = false;
      this.airBrakeUntil = -Infinity;

      if (didLand) {
        this.restoreGroundedVisual();
      }
    }

    this.updateShadow();
  }

  isGrounded(): boolean {
    return this.grounded;
  }

  flashHit(): void {
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(1);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.28,
      yoyo: true,
      repeat: 4,
      duration: 70,
      ease: "Sine.easeInOut",
      onComplete: () => this.setAlpha(1),
    });
  }

  setDebugVisible(visible: boolean): void {
    this.collisionDebugBox.setVisible(visible);
  }

  destroy(fromScene?: boolean): void {
    this.stopIdleTween();
    this.shadow.destroy();
    super.destroy(fromScene);
  }

  private createIdleTween(): void {
    if (!this.sprite) return;

    this.stopIdleTween();
    this.idleTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 0.985,
      scaleY: this.sprite.scaleY * 1.018,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private stopIdleTween(): void {
    this.idleTween?.stop();
    this.idleTween = undefined;
    if (!this.sprite) return;

    this.sprite.setScale(1);
    this.sprite.setDisplaySize(this.getSpriteDisplaySize(), this.getSpriteDisplaySize());
  }

  private setPlayerTexture(textureKey: string, sizeMultiplier = 1): void {
    if (!this.sprite || !this.scene.textures.exists(textureKey)) return;

    this.sprite.stop();
    if (this.activeTextureKey !== textureKey) {
      this.sprite.setTexture(textureKey);
    }
    this.sprite.setDisplaySize(
      this.getSpriteDisplaySize() * sizeMultiplier,
      this.getSpriteDisplaySize() * sizeMultiplier,
    );
    this.activeTextureKey = textureKey;
  }

  private createJumpAnimation(): void {
    if (!this.scene.textures.exists(IMAGE_ASSETS.PLAYER_JUMP.key) || this.scene.anims.exists("player_jump_anim")) {
      return;
    }

    this.scene.anims.create({
      key: "player_jump_anim",
      frames: this.scene.anims.generateFrameNumbers(IMAGE_ASSETS.PLAYER_JUMP.key, {
        start: 0,
        end: 8,
      }),
      frameRate: 14,
      repeat: -1,
    });
  }

  private playJumpAnimation(): void {
    if (!this.sprite || !this.scene.anims.exists("player_jump_anim")) return;

    this.sprite.play("player_jump_anim");
  }

  private createAttackAnimation(): void {
    if (!this.scene.textures.exists(IMAGE_ASSETS.PLAYER_ATTACK.key) || this.scene.anims.exists("player_attack_anim")) {
      return;
    }

    this.scene.anims.create({
      key: "player_attack_anim",
      frames: this.scene.anims.generateFrameNumbers(IMAGE_ASSETS.PLAYER_ATTACK.key, {
        start: 0,
        end: 2,
      }),
      frameRate: 18,
      repeat: 0,
    });
  }

  private restoreAfterAttack(attackToken: number): void {
    if (!this.sprite || attackToken !== this.attackAnimationToken || this.activeTextureKey !== IMAGE_ASSETS.PLAYER_ATTACK.key) return;

    if (this.grounded) {
      this.restoreGroundedVisual();
      return;
    }

    this.setPlayerTexture(IMAGE_ASSETS.PLAYER_JUMP.key);
    this.playJumpAnimation();
  }

  private restoreGroundedVisual(): void {
    this.setPlayerTexture(IMAGE_ASSETS.PLAYER_IDLE.key);
    this.createIdleTween();
  }

  private getSpriteDisplaySize(): number {
    if (this.spriteDisplaySize <= 0) {
      this.spriteDisplaySize = balanceConfig.player.height * 1.7;
    }

    return this.spriteDisplaySize;
  }

  private updateShadow(): void {
    const jumpHeight = Phaser.Math.Clamp(balanceConfig.player.startY - this.y, 0, 260);
    const heightRate = jumpHeight / 260;
    const scaleX = Phaser.Math.Linear(1, 0.5, heightRate);
    const scaleY = Phaser.Math.Linear(1, 0.62, heightRate);
    const alpha = Phaser.Math.Linear(0.48, 0.18, heightRate);

    this.shadow
      .setPosition(this.x, this.getShadowY())
      .setScale(scaleX, scaleY)
      .setAlpha(alpha);
  }

  private getShadowY(): number {
    return balanceConfig.player.startY + balanceConfig.player.height * 0.78 - 7;
  }
}
