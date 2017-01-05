/**
 * @file Pilot.ts
 */

/**
 * During an attack, 3 things can happen:
 */
export enum AttackResult {
    MISS,
    HIT,
    CRIT
};

const NOMINAL_HIT_CHANCE = 0.75;
const MAX_CRIT_CHANCE    = 0.25;
const CRIT_EFFECTIVENESS = 1.0;

/**
 * Every ship needs a pilot. Pilots control the
 * - Hit chance (accuracy)
 * - Dodge chance (evasion)
 * - Crit chance (precision)
 * of a ship
 */
export class Pilot {
    readonly name: string;    /* Name of the pilot              */
    accuracy: number;         /* Controls hit chance            */
    evasion: number;          /* Controls dodge chance          */
    precision: number;        /* Controls precision             */

    constructor(name: string, stats: [number, number, number]) {
        this.name = name;
        [this.accuracy, this.evasion, this.precision] = stats;
    }
    /**
     * Determine the result of this pilot attacking another
     * @param  {Pilot}        victim Pilot to attack
     * @return {AttackResult}        Result of attack
     */
    attack(victim: Pilot): AttackResult {
        const matchup = this.accuracy / (this.accuracy + victim.evasion);
        const hit_chance = NOMINAL_HIT_CHANCE +
                           (1 - NOMINAL_HIT_CHANCE) * matchup;

        if (Math.random() > hit_chance) return AttackResult.MISS;

        /* Definitely hit, now determine if it was a crit or not */
        const pval = this.precision / CRIT_EFFECTIVENESS;
        const crit_chance = MAX_CRIT_CHANCE / (1 + Math.exp(pval));

        if (Math.random() > crit_chance) return AttackResult.HIT;

        return AttackResult.CRIT;
    }
};
