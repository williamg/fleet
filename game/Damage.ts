/**
 * @file game/Damage.ts
 */

import { Ship } from "./Ship"
import { StatusEffect } from "./StatusEffect"

const NOMINAL_HIT_CHANCE = 0.75;
const MAX_CRIT_CHANCE    = 0.25;
const CRIT_EFFECTIVENESS = 1.0;
const CRIT_MULTIPLIER    = 2.0;

export enum DamageResult {
    NORMAL,
    CRIT,
};

export class DamageSource {
    static fromShip(ship: Ship): DamageSource {
        return new DamageSource("ship", ship, null);
    }

    static fromStatusEffect(status_effect: StatusEffect): DamageSource {
        return new DamageSource("status-effect", null, status_effect);
    }

    readonly type: "ship" | "status-effect";
    readonly ship: Ship | null;
    readonly status_effect: StatusEffect | null;

    private constructor(type: "ship" | "status-effect", ship: Ship | null,
                        status_effect: StatusEffect | null) {
        this.type = type;
        this.ship = ship;
        this.status_effect = status_effect;
    }
}

export class Damage {
    readonly source: DamageSource;
    result: DamageResult;
    amount: number;
    target: Ship;

    static fromCombat(attacker: Ship, defender: Ship, base: number):
        Damage | null {
        const aacc = attacker.accuracy.value();
        const deva = defender.evasion.value();
        const apre = attacker.precision.value();

        const matchup = aacc / (aacc + deva);
        const hit_chance = NOMINAL_HIT_CHANCE +
                           (1 - NOMINAL_HIT_CHANCE) * matchup;

        /* Swing and a miss */
        if (Math.random() > hit_chance) {
            console.log("MISS");
            return null;
        }

        /* Definitely hit, now determine if it was a crit or not */
        const pval = apre / CRIT_EFFECTIVENESS;
        const crit_chance = MAX_CRIT_CHANCE / (1 + Math.exp(pval));
        const result = (Math.random() > crit_chance) ? DamageResult.NORMAL
                                                     : DamageResult.CRIT;
        const amount = (result == DamageResult.CRIT) ? CRIT_MULTIPLIER * base
                                                     : base;

        return new Damage(result, amount, DamageSource.fromShip(attacker),
                          defender);
    }

    constructor(result: DamageResult, amount: number, source: DamageSource,
                target: Ship) {
        this.source = source;
        this.result = result;
        this.amount = amount;
        this.target = target;
    }
}
