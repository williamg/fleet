/**
 * @file game/Ship.ts
 */

import { Vec2, hexDist } from "./Math";
import { Pilot } from "./Pilot";
import { GameState } from "./Game";
import { Action } from "./Action";
import { PlayerID } from "./Player"
import { TargetDescription } from "./Target"

/**
 * Describes a particular class of ship.
 */
export interface ShipClass {
    size: number;        /* Number of units this class takes up in the hanger */
    max_health: number;  /* Maximum health                                    */
    max_charge: number;  /* Maximum charge                                    */
    recharge: number;    /* Amount this ship recharges every turn             */
    move_cost: number;   /* Cost to move a single tile                        */
    num_slots: number;   /* Number of item slots available                    */
}

export const Jumper: ShipClass = {
    size: 1,
    max_health: 50,
    max_charge: 50,
    recharge: 5,
    move_cost: 10,
    num_slots: 1,
};
export const Fighter: ShipClass = {
    size: 2,
    max_health: 100,
    max_charge: 75,
    recharge: 5,
    move_cost: 20,
    num_slots: 2
};
export const Vanguard: ShipClass = {
    size: 3,
    max_health: 200,
    max_charge: 100,
    recharge: 10,
    move_cost: 50,
    num_slots: 3
};

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
    handleEquip(ship: Ship): boolean { return true; }
    /**
     * Process the end of a turn
     */
    processTurn(): void {
        this.cooldown_remaining = Math.max(0, this.cooldown_remaining - 1);
    }
    /**
     * Handle this item being unequipped from the given ship
     * @param {Ship} ship Ship being unequipped from
     */
    handleUnequip(ship: Ship): void { return; }
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
/**
 * Represents a single ship on the map (or destroyed, or not yet deployed)
 */
export class Ship {
    readonly name: string;     /* Name of the vessel            */
    readonly class: ShipClass; /* Ship class                    */
    readonly player: PlayerID; /* ID of owning player           */
    readonly id: number;       /* ID of this ship               */
    pilot: Pilot;              /* Pilot of this ship            */
    position: Vec2 | null;     /* Position if deployed          */
    items: (ShipItem | null)[];/* Currently equipped items      */
    health: number;            /* Current health                */
    charge: number;            /* Current charge                */

    static P1_DEPLOY_TARGETS: Vec2[] = [
        new Vec2(-2, 3), new Vec2(0, 2), new Vec2(2, 1)
    ];
    static P2_DEPLOY_TARGETS: Vec2[] = [
        new Vec2(-2, -1), new Vec2(0, -2), new Vec2(2, -3)
    ];
    private static max_id = 0;

    constructor(name: string, player: PlayerID, ship_class: ShipClass,
                pilot: Pilot) {
        this.name = name;
        this.player = player;
        this.class = ship_class;
        this.id = Ship.max_id++;
        this.pilot = pilot;
        this.position = null;
        this.items = new Array(this.class.num_slots);
        this.charge = this.class.max_charge;
        this.health = this.class.max_health;

        for (let i = 0; i < this.items.length; ++i) {
            this.items[i] = null;
        }
    }
    /**
     * Atttempt to move this ship to a different location
     * @param  {Vec2}    dest Destination location
     * @return {boolean}      Whether or not the move was successful
     */
    move(dest: Vec2): boolean {
        if (this.position == null) return false;

        const range = Math.floor(this.charge / this.class.move_cost);
        const dist = hexDist(this.position, dest);

        if (dist > range)  return false;

        /* TODO: Ensure dest is actually reachable from current position */
        this.position = dest;
        this.charge -= (dist * this.class.move_cost);
        return true;
    }
    /**
     * Attempt to deploy this ship onto the hex grid
     * @param  {Vec2}    dest Destination hex
     * @return {boolean}      Whether or not deploying was successful
     */
    deploy(dest: Vec2): boolean {
        if (this.position != null) return false;

        this.position = dest;
        return true;
    }
    /**
     * Equip an item onto this ship
     * @param  {ShipItem} item Item to equip
     * @param  {number}   slot Slot to equip into [0, ship.class.num_slots)
     * @return {boolean}       True on success, false on error
     */
    equip(item: ShipItem, slot: number): boolean {
        console.assert(slot >= 0 && slot < this.items.length)

        let old_item = this.unequip(slot);

        if (item.handleEquip(this)) {
            this.items[slot] = item;
            return true;
        } else {
            if (old_item != null && !old_item.handleEquip(this)) {
                console.assert(false);
            }

            return false;
        }
    }
    /**
     * Use the item in the given slot
     * @param  {number}      slot   Item to use
     * @param  {Vec2 | null} target Target, if applicable
     * @param  {GameState}   state  Current game state
     * @return {boolean}            Whether or not it was successful
     */
    useItem(slot: number, target: Vec2 | null, state: GameState): boolean {
        console.assert(slot >= 0 && slot < this.items.length);

        if (this.items[slot] == null) return false;

        const item = this.items[slot]!;

        if (item.energy_cost > this.charge) return false;

        if (item.use(target, state)) {
            this.charge -= item.energy_cost;
        }

        return true;
    }
    /**
     * Process the ending of a turn
     */
    processTurn(): void {
        this.charge = Math.min(this.class.max_charge,
                               this.charge + this.class.recharge);
        for (let item of this.items) {
            if (item == null) continue;

            item.processTurn();
        }
    }
    /**
     * Unequip the item, if any, in the given slot
     * @param  {number}   slot Slot to unequip [0, this.class.num_slots)
     * @return {ShipItem}      Item unequipped, if any
     */
    unequip(slot: number): ShipItem | null {
        console.assert(slot >= 0 && slot < this.items.length);

        const equipped = this.items[slot];

        if (equipped != null) {
            equipped.handleUnequip(this);
            this.items[slot] = null;
        }

        return equipped;
    }
    /**
     * Inflict some damage on this ship
     * @param {number} damage Amount of damage to do
     */
    inflictDamage(damage: number): void {
        this.health = Math.max(this.health - damage, 0);
    }
};
