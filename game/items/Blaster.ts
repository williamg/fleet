/**
 * @file game/items/Blaster.ts
 */

import { GameState } from "../Game";
import { DamageEffect } from "../effects/DamageEffect";
import { ItemInfo, ItemEffect, TargetFilter, Team } from "../Components"
import { Entity, EntityID } from "../Entity"
import { Player } from "../Player"
import { Vec2 } from "../Math";
import { itemSystem } from "../systems/ItemSystem"

const BLASTER_COOLDOWN = 0;
const BLASTER_RANGE    = 2;
const BLASTER_COST     = 25;
const BLASTER_DAMAGE   = 20;
const BLASTER_CRIT     = 35;
const BLASTER_NAME     = "Blaster";
const BLASTER_DESC     = `Inflicts ${BLASTER_DAMAGE} (${BLASTER_CRIT}) damage on
                          a targeted enemy within ${BLASTER_RANGE} units`;

/**
 * A blaster is a short-ranged targeted weapon.
 */
export function newBlaster(ship: Entity): Entity | null {
    const team = ship.getComponent(Team);

    if (team == null) return null;

    const blaster = new Entity();
    const id = blaster.id;
    blaster.addComponent(ItemInfo, id, BLASTER_NAME, BLASTER_DESC,
                         BLASTER_COOLDOWN, ship.id);
    blaster.addComponent(TargetFilter, id, {
        in_range_of_entity: [ship.id, BLASTER_RANGE],
        on_team: Player.other(team.team),
    });
    blaster.addComponent(DamageEffect, id, ship.id, BLASTER_DAMAGE);

    if (itemSystem.equip(id, ship.id)) return blaster;

    blaster.destroy();
    return null;


}
