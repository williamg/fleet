/**
 * @file game/DeployPad.ts
 */

import { EntityType, GridEntity } from "./GridEntity"
import { Vec2 } from "./Math"
import { PlayerID } from "./Player"
import { Resource } from "./Resource"
import { Attribute } from "./Attribute"
import { StatusEffect, EffectManager } from "./StatusEffect"
import { Damage } from "./Damage"
import { Ship } from "./Ship"

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


    private readonly on_destroy: (e: GridEntity) => void; /* Destroy callback    */
    readonly health: Resource;
    readonly charge: Resource;
    readonly recharge: Attribute;
    readonly effectManager: EffectManager;

    constructor(player: PlayerID, position: Vec2,
                on_destroy: (e: GridEntity) => void) {
        super(EntityType.DEPLOY_PAD, player, position);

        this.on_destroy = on_destroy;
        this.health = new Resource(0, DP_MAX_HEALTH, DP_MAX_HEALTH);
        this.charge = new Resource(0, DP_MAX_CHARGE, DP_MAX_CHARGE);
        this.recharge = new Attribute(0, DP_MAX_CHARGE, DP_RECHARGE);
        this.effectManager = new EffectManager(this);
    }

    deploy() {
        this.charge.increment(-this.charge.current);
    }

    processTurnEnd(): void {
        this.charge.increment(this.recharge.value());
    }
    /**
     * Apply an effect to this ship
     */
    applyEffect(effect: StatusEffect): void {
        this.effectManager.apply(effect);
    }
    /**
     * Inflict some damage on another ship
     * @param {number} damage Amount of damage to do
     */
    inflictDamage(damage: Damage): void {
        this.effectManager.modifyInflictDamage(damage);

        if (damage.target.type == EntityType.SHIP) {
            (damage.target as Ship).receiveDamage(damage);
        } else if (damage.target.type == EntityType.DEPLOY_PAD) {
            (damage.target as DeployPad).receiveDamage(damage);
        }
    }
    /**
     * Receive incoming damage
     * @param {Damage} damage Damage received
     */
    receiveDamage(damage: Damage): void {
        this.effectManager.modifyReceiveDamage(damage);

        this.health.increment(-damage.amount);

        if (this.health.current == 0) {
            this.on_destroy(this);
        }
    }
}
