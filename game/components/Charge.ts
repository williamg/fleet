/**
 * @file game/components/Charge.ts
 */

import { Attribute } from "../Attribute"
import { Component } from "../Component"
import { Entity } from "../Entity"
import { clamp } from "../Math"

/**
 *  Provides the "Charge" resource for entities. Charge is used to pay for
 *  abilities & movement. A portion of a unit's charge is (typically) restored
 *  at the end of each turn.
 */
export class Charge extends Component {
    /**
     * Maximum chage that can be held
     * @type {number}
     */
    readonly max_charge: number;
    /**
     * Current charge
     * @type {number}
     */
    current_charge: number;
    /**
     * How much charge is regained at the end of each turn
     * @type {Attribute}
     */
    readonly recharge: Attribute;

    constructor(entity: Entity, max_charge: number, recharge: number) {
        super(entity);

        this.max_charge = max_charge;
        this.current_charge = max_charge;
        this.recharge = new Attribute(0, Infinity, recharge);
    }

    /**
     * Recharge at the end of each turn
     */
    processTurnEnd(): void {
        this.increment(this.recharge.value());
    }
    /**
     * Increment the current charge by a certain amount
     * @param  {number} amount Amount ot increment by
     */
    increment(amount: number): void {
        this.current_charge += amount;
        this.current_charge = clamp(this.current_charge, 0, this.max_charge);
    }
}
