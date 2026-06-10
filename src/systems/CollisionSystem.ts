import Phaser from "phaser";
import { balanceConfig } from "../config/balanceConfig";
import type { Monster } from "../entities/Monster";
import type { Player } from "../entities/Player";

export class CollisionSystem {
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
    const playerCollisionRadius = Math.max(balanceConfig.player.width, balanceConfig.player.height) / 2;
    const distance = Phaser.Math.Distance.Between(player.x, player.y, monster.x, monster.y);

    return distance <= playerCollisionRadius + monster.radius;
  }

  static enemyReachedBottom(monster: Monster): boolean {
    return monster.y + monster.radius >= balanceConfig.world.defenseLineY;
  }
}
