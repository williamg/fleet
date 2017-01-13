/**
 * @file game/components/Pilots.ts
 */
import { Attribute } from "../Attribute"
import { Component } from "../Component"
import { Entity } from "../Entity"

/**
 * A pilot determines a ship's hit chance, crit chance, and dodge chance.
 */
export class Pilot extends Component {
    readonly name: string;
    readonly accuracy: Attribute;
    readonly precision: Attribute;
    readonly evasion: Attribute;

    constructor(entity: Entity, name: string, accuracy: number,
                precision: number, evasion: number) {
        super(entity);

        this.name = name;
        this.accuracy = new Attribute(0, Infinity, accuracy);
        this.precision = new Attribute(0, Infinity, precision);
        this.evasion = new Attribute(0, Infinity, evasion);
    }
}
