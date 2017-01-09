/**
 * @file Pilot.ts
 */

import { Attribute } from "./Attribute"

/**
 * Every ship needs a pilot. Pilots control the
 * - Hit chance (accuracy)
 * - Crit chance (precision)
 * - Dodge chance (evasion)
 * of a ship
 */
export class Pilot {
    readonly name: string;         /* Name of the pilot              */
    readonly accuracy: Attribute;  /* Controls hit chance            */
    readonly precision: Attribute; /* Controls precision             */
    readonly evasion: Attribute;   /* Controls dodge chance          */

    constructor(name: string, [acc, pre, eva]: [number, number, number]) {
        this.name = name;
        this.accuracy = new Attribute(0, Infinity, acc);
        this.precision = new Attribute(0, Infinity, pre);
        this.evasion = new Attribute(0, Infinity, eva);
    }
};
