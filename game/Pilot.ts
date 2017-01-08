/**
 * @file Pilot.ts
 */

/**
 * Every ship needs a pilot. Pilots control the
 * - Hit chance (accuracy)
 * - Dodge chance (evasion)
 * - Crit chance (precision)
 * of a ship
 */
export class Pilot {
    readonly name: string;      /* Name of the pilot              */
    readonly accuracy: number;  /* Controls hit chance            */
    readonly evasion: number;   /* Controls dodge chance          */
    readonly precision: number; /* Controls precision             */

    constructor(name: string, stats: [number, number, number]) {
        this.name = name;
        [this.accuracy, this.evasion, this.precision] = stats;
    }
};
