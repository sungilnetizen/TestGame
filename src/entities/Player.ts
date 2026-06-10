import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";

export class Player extends Phaser.GameObjects.Container {
  private readonly bodyBox: Phaser.GameObjects.Rectangle;
  private velocityY = 0;
  private grounded = true;
  private airAttackUsed = false;
  private airBrakeUntil = -Infinity;

  constructor(scene: Phaser.Scene) {
    super(scene, balanceConfig.player.startX, balanceConfig.player.startY);

    this.bodyBox = scene.add.rectangle(
      0,
      0,
      balanceConfig.player.width,
      balanceConfig.player.height,
      0x5fd0ff,
    );
    const helm = scene.add.rectangle(0, -25, 22, 10, 0xf3d88b);
    const blade = scene.add.rectangle(20, -10, 5, 42, 0xe9edf6);

    this.add([blade, this.bodyBox, helm]);
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
  }

  isGrounded(): boolean {
    return this.grounded;
  }
}
