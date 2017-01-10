/**
 * @file game/effects/AttributeBuff.ts
 */
 import { StatusEffect } from "../StatusEffect"
 import { Attribute, BuffID } from "../Attribute"
 import { GridEntity, EntityType } from "../GridEntity"
 import { Ship } from "../Ship"

 export type AttributeName = "recharge" | "move_cost" | "accuracy" |
                             "precision" | "evasion";

/**
 * Applies an attribute buff for a fixed number of turns
 *
 * TODO: Make this more flexible so it can apply to generic GridEntities
 */
export class AttributeBuff extends StatusEffect {
    private readonly attribute: AttributeName;
    private readonly additive: number;
    private readonly percent: number;
    private readonly cap: number;
    private readonly duration: number;
    private ship: Ship | null;
    private turns_remaining: number;
    private additive_id: BuffID | null;
    private percent_id: BuffID | null;

    constructor(attribute: AttributeName, additive: number,
                 percent: number, cap: number, duration: number) {
        super();
        this.attribute = attribute;
        this.additive = additive;
        this.percent = percent;
        this.cap = cap;
        this.duration = duration;
        this.ship = null;
        this.turns_remaining = this.duration;
        this.additive_id = null;
        this.percent_id = null;
    }

    apply(entity: GridEntity) {
        if (entity.type != EntityType.SHIP) return;

        const ship = entity as Ship;
        const attribute = this.getAttribute(ship);

        this.ship = ship;
        this.additive_id = attribute.addAdditiveBonus(this.additive);
        this.percent_id = attribute.addPercentBonus(this.percent, this.cap);
        this.turns_remaining = this.duration;
    }

    isActive(): boolean {
        return this.turns_remaining > 0;
    }

    processTurnEnd() {
        if (this.turns_remaining > 0) this.turns_remaining--;

        if (this.turns_remaining == 0) {
            const attribute = this.getAttribute(this.ship!);
            attribute.removeAdditiveBonus(this.additive_id!);
            attribute.removePercentBonus(this.percent_id!);
        }
    }

    private getAttribute(ship: Ship): Attribute {
        switch(this.attribute) {
            case "recharge": return ship.recharge;
            case "move_cost": return ship.move_cost;
            case "accuracy": return ship.pilot.accuracy;
            case "precision": return ship.pilot.precision;
            case "evasion": return ship.pilot.evasion;
        }
    }
}
