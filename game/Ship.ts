/**
 * @file game/Ship.ts
 */

import { Movement, Charge, Health, Items, Team, Size, Pilot } from "./Components"
import { PlayerID } from "./Player"
import { Entity } from "./Entity"

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

export function newShip(ship_class: ShipClass, player: PlayerID, pilot_name: string,
                        pilot_stats: [number, number, number]): Entity {
    let entity = new Entity();
    const id = entity.id;
    entity.addComponent(Charge, id, ship_class.max_charge, ship_class.recharge);
    entity.addComponent(Health, id, ship_class.max_health);
    entity.addComponent(Movement, id, ship_class.move_cost);
    entity.addComponent(Size, id, ship_class.size);
    entity.addComponent(Team, id, player);
    entity.addComponent(Items, id, ship_class.num_slots);

    const [acc, pre, eva] = pilot_stats;
    entity.addComponent(Pilot, id, pilot_name, acc, pre, eva);

    return entity;
}
