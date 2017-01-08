/**
 * @file game/ShipItem.ts
 */

import { Vec2 } from "./Math"
import { Ship } from "./Ship"
import { TargetDescription } from "./Target"
import { GameState } from "./Game"

/**
 * An item that can go in one of a ship's slots. An item performs 2 crucial
 * tasks:
 *  - Describe the type of arguments a valid action using this item needs to
 *    have (this is only used on the UI side)
 *  - Given a valid action, modify the state after having performed that action
 */
export abstract class ShipItem {
    readonly energy_cost: number;  /* How much charge this item uses          */
    readonly cooldown: number;     /* How many turns must pass before this item
                                    * can be used again. Setting this to 0
                                    * allows an item to be used multiple times
                                    * in a single turn
                                    */
    readonly name: string;         /* Name of this item                       */
    readonly description: string;  /* Description of this item                */
    cooldown_remaining: number;    /* How many turns before this item is ready*/
    turn_finish_id: number;

    constructor(name: string, description: string, energy_cost: number,
                cooldown: number) {
        this.name = name;
        this.description = description;
        this.energy_cost = energy_cost;
        this.cooldown = cooldown;
        this.cooldown_remaining = 0;
    }
    /**
     * Handle this item being equipped with the given ship
     * @param  {Ship}    ship Ship being equipped to
     * @return {boolean}      True if successful, false on error
     */
    handleEquip(ship: Ship): boolean {
        return true;
    }
    /**
     * Process the end of a turn
     */
    processTurnEnd(): void {
        this.cooldown_remaining = Math.max(0, this.cooldown_remaining - 1);
    }
    /**
     * Handle this item being unequipped from the given ship
     * @param {Ship} ship Ship being unequipped from
     */
    handleUnequip(ship: Ship): void {
        return;
    }
    /**
     * If a target is required to use this item, return a valid description
     * @return {TargetDescription} Description of target if required
     */
    targetRequired(): TargetDescription | null { return null; }
    /**
     * Use this item, modifying the state
     * @param  {Action}    action Action to perform. Will be of type ACTIVATE.
     * @param  {GameState} state  Current game state
     * @return {boolean}          True on success, false on error
     */
    use(target: Vec2 | null, state: GameState): boolean {
        if (this._use(target, state)) {
            this.cooldown_remaining = this.cooldown;
            return true;
        }

        return false;
    }
    /**
     * Subclass implementation to use the item
     */
    abstract _use(target: Vec2 | null, state: GameState): boolean;
};
