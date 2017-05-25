/**
 * @file game/Ship.ts
 */

import { Entity } from "./Entity"
import { GlobalState } from "./GlobalState"
import { Vec2 } from "./Math"
import { Charge } from "./components/Charge"
import { Deployable } from "./components/Deployable"
import { DeployZone } from "./components/DeployZone"
import { Health } from "./components/Health"
import { Pilot } from "./components/Pilot"
import { Position } from "./components/Positioning"
import { ShipInfo } from "./components/ShipInfo"
import { Team, TeamID } from "./components/Team"
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

export function newShip(state: GlobalState, ship_class: ShipClass, name: string,
                        player: TeamID, pilot_name: string,
                        pilot_stats: [number, number, number]): Entity {
    let entity = new Entity(state);
    entity.addComponent(Charge, entity, ship_class.max_charge, ship_class.recharge);
    entity.addComponent(Health, entity, ship_class.max_health);
    entity.addComponent(Deployable, entity, ship_class.move_cost);
    entity.addComponent(ShipInfo, entity, name, ship_class.size);
    entity.addComponent(Team, entity, player);

    const [acc, pre, eva] = pilot_stats;
    entity.addComponent(Pilot, entity, pilot_name, acc, pre, eva);

    return entity;
}

export function newDeployPad(state: GlobalState, pos: Vec2, player: TeamID): Entity {
    let entity = new Entity(state);
    entity.addComponent(Charge, entity, 50, 5);
    entity.addComponent(Health, entity, 100);
    entity.addComponent(DeployZone, entity, state.grid.neighbors(pos));
    entity.addComponent(Position, entity, pos);
    entity.addComponent(Team, entity, player);

    return entity;
}
