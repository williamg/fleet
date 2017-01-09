/**
 * @file game/DeployPad.ts
 */

import { EntityType, GridEntity } from "./GridEntity"
import { Vec2 } from "./Math"
import { PlayerID } from "./Player"
import { Resource } from "./Resource"
import { Attribute } from "./Attribute"

const DP_MAX_HEALTH = 50;
const DP_MAX_CHARGE = 100;
const DP_RECHARGE   = 20;

/**
 * Deploy pads allow a player's ships to deploy to surrounding tiles
 */
export class DeployPad extends GridEntity {
    static CHARGE_REQUIRED: number = DP_MAX_CHARGE;
    static P1_TARGETS: Vec2[] = [
        new Vec2(-4, 3), new Vec2(0, 2), new Vec2(4, -1)
    ];
    static P2_TARGETS: Vec2[] = [
        new Vec2(-4, 1), new Vec2(0, -2), new Vec2(4, -3)
    ];


    readonly health: Resource;
    readonly charge: Resource;
    readonly recharge: Attribute;

    constructor(player: PlayerID, position: Vec2) {
        super(EntityType.DEPLOY_PAD, player, position);

        this.health = new Resource(0, DP_MAX_HEALTH, DP_MAX_HEALTH);
        this.charge = new Resource(0, DP_MAX_CHARGE, DP_MAX_CHARGE);
        this.recharge = new Attribute(0, DP_MAX_CHARGE, DP_RECHARGE);
    }

    deploy() {
        this.charge.increment(-this.charge.current);
    }

    processTurnEnd(): void {
        this.charge.increment(this.recharge.value());
    }
}
