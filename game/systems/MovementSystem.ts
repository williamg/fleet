/**
 * @file game/systems/MovementSystem.ts
 */

import { Entity, EntityID, System, Component } from "../Entity"
import { Movement, Charge, HexPosition } from "../components/Components"
import { Vec2, hexDist } from "../Math"

export class MovementSystem extends System {

    constructor() {
        super();
    }

    processTurnEnd(player: PlayerID) {}

    moveEntity(id: EntityID, dest: Vec2): boolean {
        const entity = Entity.getEntity(id);

        if (entity == null) return false;

        const poscomp = entity.getComponent(HexPosition);
        const movecomp = entity.getComponent(Movement);
        const chargecomp = entity.getComponent(Charge);

        if (poscomp == null || movecomp == null || chargecomp == null) {
            return false;
        }

        const dist = hexDist(poscomp.position, dest);
        const cost = movecomp.charge_per_tile * dist;

        if (chargecomp.current_charge < cost) return false;

        /* Gross expensive check to see if any entity is at dest */
        for (let entity of Entity.all()) {
            const pos = entity.getComponent(HexPosition);

            if (pos == null) continue;

            if (pos.position.equals(dest)) return false;
        }

        /* Every thing worked, deduct the cost, move the entity */
        chargecomp.current_charge -= cost;
        movecomp.position = dest;
        return true;
    }
}
