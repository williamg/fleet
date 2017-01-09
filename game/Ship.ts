/**
 * @file game/Ship.ts
 */

import { Vec2, hexDist } from "./Math";
import { GridEntity, EntityType } from "./GridEntity"
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
 * Represents a ship *not* on the map (either not yet deployed or destroyed)
 */
export class ShipInfo {
    readonly name: string;
    readonly player: PlayerID;
    readonly class: ShipClass;
    readonly pilot: Pilot;
    readonly items: ShipItem[];

    static fromShip(ship: Ship): ShipInfo {
        return new ShipInfo(ship.name, ship.player, ship.class, ship.pilot,
                            ship.items);
    }

    constructor(name: string, player: PlayerID, ship_class: ShipClass,
                pilot: Pilot, items: ShipItem[]) {
        this.name = name;
        this.player = player;
        this.class = ship_class;
        this.pilot = pilot;
        this.items = items;
    }

    toShip(position: Vec2, on_destroy: (ship: Ship) => void): Ship {
        return new Ship(this.name, this.player, this.class, this.pilot,
                        position, this.items, on_destroy);
    }
}
/**
 * Represents a single ship on the map (or destroyed, or not yet deployed)
 */
export class Ship extends GridEntity {
    /* Ship info */
    readonly name: string;                             /* Name of the vessel  */
    readonly class: ShipClass;                         /* Ship class          */
    private readonly on_destroy: (ship: Ship) => void; /* Destroy callback    */

    /* Ship state */
    readonly items: ShipItem[];       /* Equipped items      */
    readonly health: Resource;
    readonly charge: Resource;
    readonly effectManager: EffectManager;
    readonly recharge: Attribute;
    readonly move_cost: Attribute;
    readonly pilot: Pilot;

    constructor(name: string, player: PlayerID, ship_class: ShipClass,
                pilot: Pilot, position: Vec2, items: ShipItem[],
                on_destroy: (ship: Ship) => void) {
        super(EntityType.SHIP, player, position);

        this.name = name;
        this.class = ship_class;
        this.pilot = pilot;
        this.on_destroy = on_destroy;

        this.items = items;
        this.health = new Resource(0, this.class.max_health,
                                   this.class.max_health);
        this.charge = new Resource(0, this.class.max_charge,
                                   this.class.max_charge);
        this.effectManager = new EffectManager(this);
        this.recharge =
            new Attribute(0, this.class.max_charge, this.class.recharge);
        this.move_cost = new Attribute(0, Infinity, this.class.move_cost);

        for (let i = 0; i < this.items.length; ++i) {
            this.items[i].handleEquip(this);
        }
    }
    /**
     * Atttempt to move this ship to a different location
     * @param  {Vec2}    dest Destination location
     * @return {boolean}      Whether or not the move was successful
     */
    move(dest: Vec2): boolean {
        const move_cost = this.move_cost.value();
        const range = Math.floor(this.charge.current / move_cost);
        const dist = hexDist(this._position, dest);

        if (dist > range)  return false;

        /* TODO: Ensure dest is actually reachable from current position */
        this._position = dest;
        this.charge.increment(-dist * move_cost);
        return true;
    }
    /**
     * Apply an effect to this ship
     */
    applyEffect(effect: StatusEffect): void {
        this.effectManager.apply(effect);
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
