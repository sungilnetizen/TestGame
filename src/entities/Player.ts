import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import { IMAGE_ASSETS } from "../assets/AssetManifest";

export class Player extends Phaser.GameObjects.Container {
  private readonly bodyBox: Phaser.GameObjects.Rectangle;
  private readonly collisionDebugBox: Phaser.GameObjects.Rectangle;
  private readonly shadow: Phaser.GameObjects.Ellipse;
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
      const sprite = scene.add
        .image(0, -4, IMAGE_ASSETS.PLAYER_IDLE.key)
        .setDisplaySize(balanceConfig.player.width * 1.8, balanceConfig.player.height * 1.7);
      this.bodyBox.setVisible(false);
      this.add([sprite, this.bodyBox, this.collisionDebugBox]);
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
  }

  softenJumpFromAttack(): void {
    if (this.grounded || this.airAttackUsed) return;

    this.airAttackUsed = true;

    if (this.velocityY < 0) {
      this.velocityY *= balanceConfig.combat.airAttackVelocityMultiplier;
      this.airBrakeUntil = this.scene.time.now + balanceConfig.combat.airAttackBrakeDuration;
    }
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
      this.grounded = true;
      this.airAttackUsed = false;
      this.airBrakeUntil = -Infinity;
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

  destroy(fromScene?: boolean): void {
    this.shadow.destroy();
    super.destroy(fromScene);
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
