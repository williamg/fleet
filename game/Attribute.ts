/**
 * @file game/Attribute.ts
 */
/**
 * ID class for buffs applied to attributes
 */
export class BuffID {
    private static next_id = 0;

    private readonly id: number;

    constructor() {
        this.id = BuffID.next_id++;
    }
}
/**
 * Describes an attribute that can be modified by status effects
 */
export class Attribute {
    private readonly min: number;
    private readonly max: number;
    private readonly base: number;
    private additive_bonuses: Map<BuffID, number>;
    private percent_bonuses: Map<BuffID, [number, number]>

    constructor(min: number, max: number, base: number) {
        console.assert(min <= base && base <= max);

        this.min = min;
        this.max = max;
        this.base = base;
        this.additive_bonuses = new Map<BuffID, number>();
        this.percent_bonuses = new Map<BuffID, [number, number]>();
    }

    addAdditiveBonus(amount: number): BuffID {
        const id = new BuffID();

        this.additive_bonuses.set(id, amount);
        return id;
    }

    addPercentBonus(percent: number, cap?: number) {
        const id = new BuffID();

        this.percent_bonuses.set(id, [percent, cap || Infinity]);
        return id;
    }
    removeAdditiveBonus(id: BuffID) {
        this.additive_bonuses.delete(id);
    }
    removePercentBonus(id: BuffID) {
        this.percent_bonuses.delete(id);
    }
    value(): number {
        let val = this.base;

        for (let amount of this.additive_bonuses.values()) {
            val += amount;
        }

        /* TODO: Is it weird that percent increases stack on each other?
         * with this system:
         *
         * Base: 10          Base: 10
         * Buff: +50%        Buff: +25%
         * Buff: +25%        Buff: +50%
         * Actual = 18.25    Actual = 18.75
         */
        for (let [percent, cap] of this.percent_bonuses.values()) {
            let bonus = val * percent;

            if (bonus > cap) {
                bonus = cap;
            }

            val += bonus;
        }

        return Math.min(this.max, Math.max(this.min, val));
    }
}
