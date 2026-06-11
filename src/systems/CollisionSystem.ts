import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import type { Monster } from "../entities/Monster";
import type { Player } from "../entities/Player";

export class CollisionSystem {
  static rectsOverlap(a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle): boolean {
    return Phaser.Geom.Intersects.RectangleToRectangle(a, b);
  }

  static attackHitsEnemy(
    attackCenterX: number,
    attackCenterY: number,
    attackRadius: number,
    monster: Monster,
  ): boolean {
    const distance = Phaser.Math.Distance.Between(attackCenterX, attackCenterY, monster.x, monster.y);
    const angleToMonster = Phaser.Math.RadToDeg(
      Phaser.Math.Angle.Between(attackCenterX, attackCenterY, monster.x, monster.y),
    );
    const normalizedAngle = (angleToMonster + 360) % 360;
    const halfArc = balanceConfig.combat.attackArcDegrees / 2;
    const angleOffset = Math.abs(((normalizedAngle - 270 + 540) % 360) - 180);

    return angleOffset <= halfArc && distance <= attackRadius + monster.radius;
  }

  static playerHitsEnemy(player: Player, monster: Monster): boolean {
    return this.rectsOverlap(
      this.getPlayerHitbox(player),
      this.getMonsterHitbox(monster),
    );
  }

  static groundedPlayerHitsEnemy(player: Player, monster: Monster): boolean {
    return player.isGrounded() && this.playerHitsEnemy(player, monster);
  }

  static enemyReachedBottom(monster: Monster, defenseLineY = this.getDefenseLineY()): boolean {
    return monster.y + monster.radius >= defenseLineY;
  }

  static getDefenseLineY(): number {
    return balanceConfig.player.startY - balanceConfig.player.height / 2 + balanceConfig.player.height / 3;
  }

  static getPlayerHitbox(player: Player): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      player.x - balanceConfig.player.width / 2,
      player.y - balanceConfig.player.height / 2,
      balanceConfig.player.width,
      balanceConfig.player.height,
    );
  }

  static getMonsterHitbox(monster: Monster): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      monster.x - monster.radius,
      monster.y - monster.radius,
      monster.radius * 2,
      monster.radius * 2,
    );
  }
}
