/**
 * @file game/Ship.ts
 */

import { Vec2, hexDist } from "./Math";
import { Pilot } from "./Pilot"
import { Attribute } from "./Attribute"
import { Damage, DamageResult } from "./Damage"
import { Resource } from "./Resource"
import { GameState } from "./Game";
import { Action } from "./Action";
import { PlayerID } from "./Player"
import { ShipItem } from "./ShipItem"
import { StatusEffect, EffectManager } from "./StatusEffect"
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
 * Represents a single ship on the map (or destroyed, or not yet deployed)
 */
export class Ship {
    static P1_DEPLOY_TARGETS: Vec2[] = [
        new Vec2(-2, 3), new Vec2(0, 2), new Vec2(2, 1)
    ];
    static P2_DEPLOY_TARGETS: Vec2[] = [
        new Vec2(-2, -1), new Vec2(0, -2), new Vec2(2, -3)
    ];

    private static max_id = 0;

    /* Ship info */
    readonly name: string;                             /* Name of the vessel  */
    readonly class: ShipClass;                         /* Ship class          */
    readonly player: PlayerID;                         /* ID of owning player */
    readonly id: number;                               /* ID of this ship     */
    readonly pilot_name: string;                       /* Pilot name          */
    private readonly on_destroy: (ship: Ship) => void; /* Destroy callback    */

    /* Ship state */
    position: Vec2 | null;                     /* Position if deployed*/
    readonly items: (ShipItem | null)[];       /* Equipped items      */
    readonly health: Resource;
    readonly charge: Resource;
    readonly effectManager: EffectManager;
    readonly recharge: Attribute;
    readonly move_cost: Attribute;
    readonly accuracy: Attribute;
    readonly precision: Attribute;
    readonly evasion: Attribute;

    constructor(name: string, player: PlayerID, ship_class: ShipClass,
                pilot: Pilot, on_destroy: (ship: Ship) => void) {
        this.name = name;
        this.player = player;
        this.class = ship_class;
        this.id = Ship.max_id++;
        this.pilot_name = pilot.name;
        this.on_destroy = on_destroy;

        this.position = null;
        this.items = new Array(this.class.num_slots);
        this.health = new Resource(0, this.class.max_health,
                                   this.class.max_health);
        this.charge = new Resource(0, this.class.max_charge,
                                   this.class.max_charge);
        this.effectManager = new EffectManager(this);
        this.recharge =
            new Attribute(0, this.class.max_charge, this.class.recharge);
        this.move_cost = new Attribute(0, Infinity, this.class.move_cost);
        this.accuracy = new Attribute(0, Infinity, pilot.accuracy);
        this.precision = new Attribute(0, Infinity, pilot.precision);
        this.evasion = new Attribute(0, Infinity, pilot.evasion);

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

        const move_cost = this.move_cost.value();
        const range = Math.floor(this.charge.current / move_cost);
        const dist = hexDist(this.position, dest);

        if (dist > range)  return false;

        /* TODO: Ensure dest is actually reachable from current position */
        this.position = dest;
        this.charge.increment(-dist * move_cost);
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
     * Apply an effect to this ship
     */
    applyEffect(effect: StatusEffect): void {
        this.effectManager.apply(effect);
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

        if (item.energy_cost > this.charge.current) return false;

        if (item.use(target, state)) {
            this.charge.increment(-item.energy_cost);
        }

        return true;
    }
    /**
     * Process the ending of a turn
     */
    processTurnEnd(): void {
        this.charge.increment(this.recharge.value());
        this.effectManager.processTurnEnd();

        for (let item of this.items) {
            if (item != null) {
                item.processTurnEnd();
            }
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
     * Inflict some damage on another ship
     * @param {number} damage Amount of damage to do
     */
    inflictDamage(damage: Damage): void {
        this.effectManager.modifyInflictDamage(damage);

        damage.target.receiveDamage(damage);
    }
    /**
     * Receive incoming damage
     * @param {Damage} damage Damage received
     */
    receiveDamage(damage: Damage): void {
        this.effectManager.modifyReceiveDamage(damage);

        this.health.increment(-damage.amount);

        if (this.health.current == 0) {
            this.on_destroy(this);
        }

    }
};
