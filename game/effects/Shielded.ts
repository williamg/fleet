/**
 * @file game/effects/Shielded.ts
 */

import { StatusEffect } from "../StatusEffect"
import { GridEntity } from "../GridEntity"
import { Damage } from "../Damage"

export class Shielded extends StatusEffect {
    private shield_remaining: number;

    constructor(strength: number) {
        super();
        this.shield_remaining = strength;
    }

    apply(entity: GridEntity): void {}
    processTurnEnd(): void {}

    isActive(): boolean {
        return this.shield_remaining > 0;
    }

    modifyReceiveDamage(damage: Damage): void {
        const damage_absorbed = Math.min(this.shield_remaining, damage.amount);

        damage.amount -= damage_absorbed;
        this.shield_remaining -= damage_absorbed;
    }
}
